const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService } = require("../helpers/factories");
const app = require("../../src/app");

describe("Correção de fuso horário (tenant.timezone)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("horário local '09:00' do tenant é gravado como instante UTC correto (America/Fortaleza = UTC-3)", async () => {
    const tenant = await createTenant({ slug: "fuso-teste", timezone: "America/Fortaleza" });
    const service = await createService(tenant, { durationMin: 30 });

    // 2026-08-25 é uma terça-feira - dentro do expediente padrão (09:00-18:00)
    const res = await request(app).get(
      `/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-08-25`
    );

    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);

    // 09:00 em Fortaleza (UTC-3) deve ser 12:00 UTC - não 09:00 UTC (bug antigo)
    // nem qualquer outro deslocamento.
    expect(res.body.slots[0].startsAt).toBe("2026-08-25T12:00:00.000Z");
  });

  test("agendamento manual do admin com hora local sem 'Z' é interpretado no fuso do tenant", async () => {
    const tenant = await createTenant({ slug: "fuso-admin-teste", timezone: "America/Fortaleza" });
    const service = await createService(tenant, { durationMin: 30 });

    const appointment = await require("../../src/modules/appointments/appointments.service.js").createAppointment(
      tenant.id,
      {
        serviceId: service.id,
        startsAt: "2026-08-25T09:00:00", // hora local, sem "Z" - convenção do painel admin
        client: { name: "Cliente Teste", phone: "+5585900000009" },
      }
    );

    expect(appointment.startsAt.toISOString()).toBe("2026-08-25T12:00:00.000Z");
  });

  test("instante absoluto (com 'Z') vindo da booking page é usado tal como está, sem reconversão", async () => {
    const tenant = await createTenant({ slug: "fuso-booking-teste", timezone: "America/Fortaleza" });
    const service = await createService(tenant, { durationMin: 30 });

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({
        serviceId: service.id,
        startsAt: "2026-08-25T12:00:00.000Z", // já é o instante correto (equivalente a 09:00 local)
        client: { name: "Cliente Teste", phone: "+5585900000010" },
      });

    expect(res.status).toBe(201);
    expect(res.body.startsAt).toBe("2026-08-25T12:00:00.000Z");
  });

  test("tenant em fuso diferente (ex.: UTC) não é afetado pelo default de outro tenant", async () => {
    const tenant = await createTenant({ slug: "fuso-utc-teste", timezone: "UTC" });
    const service = await createService(tenant, { durationMin: 30 });

    const res = await request(app).get(
      `/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-08-25`
    );

    // Para um tenant em UTC, 09:00 local É 09:00 UTC
    expect(res.body.slots[0].startsAt).toBe("2026-08-25T09:00:00.000Z");
  });
});
