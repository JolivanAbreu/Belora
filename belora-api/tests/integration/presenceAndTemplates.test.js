const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService, createAdminUser, signAccessTokenFor } = require("../helpers/factories");
const { renderTemplate } = require("../../src/modules/notifications/notifications.service");
const app = require("../../src/app");

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

async function createRealAppointment(tenant, service, phone = "+5585900001234") {
  const res = await request(app)
    .post(`/public/${tenant.slug}/appointments`)
    .send({
      serviceId: service.id,
      startsAt: "2026-09-21T12:00:00.000Z",
      client: { name: "Cliente Teste", phone },
    });
  expect(res.status).toBe(201);
  return res.body;
}

describe("Confirmação de presença via link (lembrete de 30min)", () => {
  test("cliente consegue confirmar presença com o token correto", async () => {
    const tenant = await createTenant({ slug: "confirma-presenca-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/confirm-presence`)
      .send({ token: appointment.cancellationToken });

    expect(res.status).toBe(200);
    expect(res.body.presenceConfirmedAt).toBeTruthy();
    expect(res.body.status).toBe("confirmado"); // confirmar presença não altera o status do agendamento
  });

  test("token incorreto não confirma presença", async () => {
    const tenant = await createTenant({ slug: "confirma-presenca-token-invalido" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/confirm-presence`)
      .send({ token: "token-errado" });

    expect(res.status).toBe(403);
  });

  test("não permite confirmar presença de um agendamento já cancelado", async () => {
    const tenant = await createTenant({ slug: "confirma-presenca-cancelado" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/confirm-presence`)
      .send({ token: appointment.cancellationToken });

    expect(res.status).toBe(409);
  });
});

describe("Exclusão permanente de agendamento (DELETE .../permanent)", () => {
  test("admin consegue excluir permanentemente um agendamento do próprio tenant", async () => {
    const tenant = await createTenant({ slug: "exclusao-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const service = await createService(tenant, { durationMin: 30 });

    const created = await createRealAppointment(tenant, service, "+5585900005678");

    const res = await request(app)
      .delete(`/appointments/${created.id}/permanent`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get("/appointments")
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.body.find((a) => a.id === created.id)).toBeUndefined();
  });

  test("admin de um tenant não consegue excluir agendamento de outro tenant", async () => {
    const tenantA = await createTenant({ slug: "exclusao-tenant-a" });
    const tenantB = await createTenant({ slug: "exclusao-tenant-b" });
    const adminB = await createAdminUser(tenantB);
    const tokenB = signAccessTokenFor(adminB);
    const serviceA = await createService(tenantA, { durationMin: 30 });

    const created = await createRealAppointment(tenantA, serviceA, "+5585900009012");

    const res = await request(app)
      .delete(`/appointments/${created.id}/permanent`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

describe("Templates de mensagem personalizáveis", () => {
  test("renderTemplate substitui todos os placeholders conhecidos", () => {
    const result = renderTemplate("Olá {cliente}, seu {servico} é às {hora} em {endereco}.", {
      cliente: "Maria",
      servico: "Limpeza de pele",
      hora: "14:00",
      endereco: "Rua Teste, 123",
    });
    expect(result).toBe("Olá Maria, seu Limpeza de pele é às 14:00 em Rua Teste, 123.");
  });

  test("renderTemplate mantém o placeholder literal se a chave não for reconhecida", () => {
    const result = renderTemplate("Valor: {desconhecido}", {});
    expect(result).toBe("Valor: {desconhecido}");
  });

  test("tenant com template customizado usa o texto do tenant, não o padrão", async () => {
    const tenant = await createTenant({
      slug: "template-custom-teste",
      messageTemplates: { confirmation: "MENSAGEM CUSTOMIZADA para {cliente}" },
    });
    const service = await createService(tenant, { durationMin: 30 });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await createRealAppointment(tenant, service, "+5585900003456");

    await new Promise((r) => setTimeout(r, 200));

    const sentMessage = logSpy.mock.calls
      .map((args) => args.join(" "))
      .find((line) => line.includes("MENSAGEM CUSTOMIZADA"));
    expect(sentMessage).toContain("MENSAGEM CUSTOMIZADA para Cliente Teste");

    logSpy.mockRestore();
  });
});
