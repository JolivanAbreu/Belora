const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService } = require("../helpers/factories");
const app = require("../../src/app");

describe("Cancelamento pelo cliente final via link (RF-34)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  async function createRealAppointment(tenant, service) {
    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({
        serviceId: service.id,
        startsAt: "2026-09-21T12:00:00.000Z",
        client: { name: "Cliente Teste", phone: "+5585900009999" },
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  test("cliente consegue cancelar o próprio agendamento com o token correto", async () => {
    const tenant = await createTenant({ slug: "cancela-token-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    expect(appointment.cancellationToken).toBeTruthy();

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelado");
  });

  test("token incorreto não cancela o agendamento", async () => {
    const tenant = await createTenant({ slug: "cancela-token-invalido-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    const res = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: "token-completamente-errado" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("INVALID_CANCELLATION_TOKEN");

    // Garante que realmente não cancelou
    const stillThere = await request(app)
      .get(`/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-09-21`);
    expect(stillThere.body.slots.some((s) => s.startsAt === "2026-09-21T12:00:00.000Z")).toBe(false);
  });

  test("não permite cancelar duas vezes", async () => {
    const tenant = await createTenant({ slug: "cancela-duas-vezes-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    const first = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("ALREADY_CANCELLED");
  });

  test("token de um tenant não cancela agendamento de outro tenant", async () => {
    const tenantA = await createTenant({ slug: "cancela-tenant-a" });
    const tenantB = await createTenant({ slug: "cancela-tenant-b" });
    const serviceA = await createService(tenantA, { durationMin: 30 });
    const appointment = await createRealAppointment(tenantA, serviceA);

    // Tenta cancelar usando o slug do tenant B, mesmo token e mesmo appointmentId
    const res = await request(app)
      .post(`/public/${tenantB.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("APPOINTMENT_NOT_FOUND");
  });

  test("cancelamento libera o horário na disponibilidade pública", async () => {
    const tenant = await createTenant({ slug: "cancela-libera-teste" });
    const service = await createService(tenant, { durationMin: 30 });
    const appointment = await createRealAppointment(tenant, service);

    await request(app)
      .post(`/public/${tenant.slug}/appointments/${appointment.id}/cancel`)
      .send({ token: appointment.cancellationToken });

    const availability = await request(app)
      .get(`/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-09-21`);
    expect(availability.body.slots.some((s) => s.startsAt === "2026-09-21T12:00:00.000Z")).toBe(true);
  });
});
