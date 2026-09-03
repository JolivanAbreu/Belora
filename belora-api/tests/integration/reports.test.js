const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createAdminUser, signAccessTokenFor, createService, createClient } = require("../helpers/factories");
const { Appointment } = require("../../src/models");
const app = require("../../src/app");

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("Atualização de status do agendamento (PATCH /appointments/:id/status)", () => {
  test("admin marca um agendamento como concluído", async () => {
    const tenant = await createTenant({ slug: "status-concluido-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const service = await createService(tenant);
    const client = await createClient(tenant);
    const appointment = await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date("2026-07-01T12:00:00.000Z"),
      endsAt: new Date("2026-07-01T12:30:00.000Z"),
      status: "confirmado",
    });

    const res = await request(app)
      .patch(`/appointments/${appointment.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "concluido" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("concluido");
  });

  test("rejeita um status desconhecido", async () => {
    const tenant = await createTenant({ slug: "status-invalido-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const service = await createService(tenant);
    const client = await createClient(tenant);
    const appointment = await Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date("2026-07-01T12:00:00.000Z"),
      endsAt: new Date("2026-07-01T12:30:00.000Z"),
      status: "confirmado",
    });

    const res = await request(app)
      .patch(`/appointments/${appointment.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "status-que-nao-existe" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS");
  });

  test("admin de um tenant não consegue mudar status de agendamento de outro tenant", async () => {
    const tenantA = await createTenant({ slug: "status-tenant-a" });
    const tenantB = await createTenant({ slug: "status-tenant-b" });
    const adminB = await createAdminUser(tenantB);
    const tokenB = signAccessTokenFor(adminB);
    const serviceA = await createService(tenantA);
    const clientA = await createClient(tenantA);
    const appointment = await Appointment.create({
      tenantId: tenantA.id,
      clientId: clientA.id,
      serviceId: serviceA.id,
      startsAt: new Date("2026-07-01T12:00:00.000Z"),
      endsAt: new Date("2026-07-01T12:30:00.000Z"),
      status: "confirmado",
    });

    const res = await request(app)
      .patch(`/appointments/${appointment.id}/status`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ status: "concluido" });

    expect(res.status).toBe(404);
  });
});

describe("Relatórios (GET /reports/summary e /reports/top-services)", () => {
  async function seedAppointment(tenant, service, client, startsAt, status) {
    return Appointment.create({
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      startsAt: new Date(startsAt),
      endsAt: new Date(new Date(startsAt).getTime() + 30 * 60 * 1000),
      status,
    });
  }

  test("calcula faturamento mensal só a partir de agendamentos concluídos", async () => {
    const tenant = await createTenant({ slug: "relatorio-faturamento-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const service = await createService(tenant, { price: 100 });
    const client = await createClient(tenant);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();

    await seedAppointment(tenant, service, client, thisMonth, "concluido");
    await seedAppointment(tenant, service, client, thisMonth, "concluido");
    await seedAppointment(tenant, service, client, thisMonth, "cancelado"); // não deve contar
    await seedAppointment(tenant, service, client, thisMonth, "confirmado"); // futuro/pendente, não deve contar

    const res = await request(app)
      .get("/reports/summary?months=3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const currentMonthEntry = res.body.months[res.body.months.length - 1];
    expect(currentMonthEntry.revenue).toBe(200);
    expect(currentMonthEntry.completed).toBe(2);
  });

  test("calcula taxa de não comparecimento corretamente, ignorando cancelamentos", async () => {
    const tenant = await createTenant({ slug: "relatorio-noshow-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const service = await createService(tenant, { price: 50 });
    const client = await createClient(tenant);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();

    await seedAppointment(tenant, service, client, thisMonth, "concluido");
    await seedAppointment(tenant, service, client, thisMonth, "concluido");
    await seedAppointment(tenant, service, client, thisMonth, "concluido");
    await seedAppointment(tenant, service, client, thisMonth, "nao_compareceu");
    await seedAppointment(tenant, service, client, thisMonth, "cancelado"); // não entra no denominador

    const res = await request(app)
      .get("/reports/summary?months=1")
      .set("Authorization", `Bearer ${token}`);

    const currentMonthEntry = res.body.months[0];
    // 1 falta em 4 (3 concluídos + 1 falta) = 25%
    expect(currentMonthEntry.noShowRate).toBe(25);
  });

  test("meses sem nenhum agendamento aparecem com valores zerados, não ausentes", async () => {
    const tenant = await createTenant({ slug: "relatorio-mes-vazio-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);

    const res = await request(app)
      .get("/reports/summary?months=6")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(6);
    expect(res.body.months.every((m) => m.revenue === 0)).toBe(true);
    expect(res.body.months.every((m) => m.noShowRate === null)).toBe(true);
  });

  test("ranking de serviços ordena por faturamento, maior primeiro", async () => {
    const tenant = await createTenant({ slug: "relatorio-top-servicos-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const serviceA = await createService(tenant, { name: "Serviço Caro", price: 200 });
    const serviceB = await createService(tenant, { name: "Serviço Barato", price: 30 });
    const client = await createClient(tenant);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();

    await seedAppointment(tenant, serviceB, client, thisMonth, "concluido");
    await seedAppointment(tenant, serviceB, client, thisMonth, "concluido");
    await seedAppointment(tenant, serviceB, client, thisMonth, "concluido"); // 3 x 30 = 90
    await seedAppointment(tenant, serviceA, client, thisMonth, "concluido"); // 1 x 200 = 200

    const res = await request(app)
      .get("/reports/top-services?months=3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Serviço Caro");
    expect(res.body[0].revenue).toBe(200);
    expect(res.body[1].name).toBe("Serviço Barato");
    expect(res.body[1].revenue).toBe(90);
  });

  test("isolamento de tenant: relatório de um tenant nunca inclui dados de outro", async () => {
    const tenantA = await createTenant({ slug: "relatorio-isolamento-a" });
    const tenantB = await createTenant({ slug: "relatorio-isolamento-b" });
    const adminA = await createAdminUser(tenantA);
    const tokenA = signAccessTokenFor(adminA);
    const serviceB = await createService(tenantB, { price: 500 });
    const clientB = await createClient(tenantB);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();
    await seedAppointment(tenantB, serviceB, clientB, thisMonth, "concluido");

    const res = await request(app)
      .get("/reports/summary?months=1")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.body.months[0].revenue).toBe(0);
  });
});
