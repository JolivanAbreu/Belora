const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService, createClient } = require("../helpers/factories");
const { NotificationLog, Appointment } = require("../../src/models");
const { runReminderSweep } = require("../../src/jobs/reminders.job");
const app = require("../../src/app");

// Pequena espera para o envio "fire-and-forget" da confirmação ter tempo
// de rodar antes de checarmos o notifications_log (ver appointments.service.js).
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Lembretes automáticos via WhatsApp", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("criar um agendamento dispara e registra uma notificação de confirmação", async () => {
    const tenant = await createTenant({ slug: "confirmacao-teste" });
    const service = await createService(tenant, { durationMin: 30 });

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({
        serviceId: service.id,
        startsAt: "2026-09-10T12:00:00.000Z",
        client: { name: "Cliente Teste", phone: "+5585911112222" },
      });
    expect(res.status).toBe(201);

    await wait(200); // dá tempo do envio fire-and-forget completar

    const logs = await NotificationLog.findAll({ where: { appointmentId: res.body.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe("confirmation");
    expect(logs[0].channel).toBe("whatsapp");
  });

  test("runReminderSweep envia lembrete de 24h assim que a antecedência é atingida, e não duplica em nova varredura", async () => {
    const tenant = await createTenant({ slug: "lembrete-24h-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const client = await createClient(tenant, { phone: "+5585933334444" });

    const now = new Date("2026-09-10T10:00:00.000Z");
    const appointment = await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // exatamente 24h à frente
      endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "confirmado",
    });

    const firstRun = await runReminderSweep(now);
    expect(firstRun).toEqual([{ appointmentId: appointment.id, type: "reminder_24h", ok: true }]);

    const logs = await NotificationLog.findAll({ where: { appointmentId: appointment.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe("reminder_24h");

    // Rodar de novo com o mesmo "now" não deve reenviar (já foi registrado)
    const secondRun = await runReminderSweep(now);
    expect(secondRun).toHaveLength(0);
  });

  test("runReminderSweep não envia lembrete antes de a antecedência ser atingida", async () => {
    const tenant = await createTenant({ slug: "lembrete-fora-janela-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const client = await createClient(tenant, { phone: "+5585955556666" });

    const now = new Date("2026-09-10T10:00:00.000Z");
    await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48h à frente - nenhuma antecedência (24h/2h/30min) foi atingida ainda
      endsAt: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "confirmado",
    });

    const results = await runReminderSweep(now);
    expect(results).toHaveLength(0);
  });

  test("runReminderSweep se recupera sozinha de uma indisponibilidade do servidor (catch-up)", async () => {
    // Simula: o agendamento entrou na janela de 24h enquanto o servidor
    // estava fora do ar, e a varredura só roda de novo bem mais tarde -
    // mesmo assim, o lembrete de 24h deve sair (não fica perdido para sempre).
    const tenant = await createTenant({ slug: "lembrete-catchup-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const client = await createClient(tenant, { phone: "+5585944445555" });

    const bookedAt = new Date("2026-09-10T10:00:00.000Z");
    const appointment = await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date(bookedAt.getTime() + 23 * 60 * 60 * 1000), // 23h à frente no momento da criação
      endsAt: new Date(bookedAt.getTime() + 23 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "confirmado",
    });

    // Nenhuma varredura rodou em bookedAt (simula o servidor fora do ar).
    // A próxima varredura só roda bem depois, quando faltam ~1h para o
    // agendamento - mesmo assim, o lembrete de 24h (perdido) deve sair.
    const muchLater = new Date(bookedAt.getTime() + 22 * 60 * 60 * 1000);
    const results = await runReminderSweep(muchLater);

    const types = results.map((r) => r.type).sort();
    expect(types).toContain("reminder_24h");

    const log24h = await NotificationLog.findOne({ where: { appointmentId: appointment.id, type: "reminder_24h" } });
    expect(log24h).not.toBeNull();
  });

  test("runReminderSweep ignora agendamentos cancelados", async () => {
    const tenant = await createTenant({ slug: "lembrete-cancelado-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const client = await createClient(tenant, { phone: "+5585977778888" });

    const now = new Date("2026-09-10T10:00:00.000Z");
    await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "cancelado",
    });

    const results = await runReminderSweep(now);
    expect(results).toHaveLength(0);
  });

  test("GET /notifications-log retorna o histórico do próprio tenant, com dados do cliente/serviço", async () => {
    const tenant = await createTenant({ slug: "historico-teste" });
    const admin = await require("../helpers/factories").createAdminUser(tenant);
    const token = require("../helpers/factories").signAccessTokenFor(admin);
    const service = await createService(tenant, { durationMin: 30 });

    const created = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({
        serviceId: service.id,
        startsAt: "2026-09-11T12:00:00.000Z",
        client: { name: "Maria Histórico", phone: "+5585999990000" },
      });
    expect(created.status).toBe(201);
    await wait(200);

    const res = await request(app)
      .get("/notifications-log")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].Appointment.Client.name).toBe("Maria Histórico");
  });
});
