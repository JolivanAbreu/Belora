const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService } = require("../helpers/factories");
const app = require("../../src/app");

describe("Conflito de horário na agenda (Plano de Testes, seção 3.2)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("TC-10: duas requisições para o mesmo horário - apenas uma é confirmada", async () => {
    const tenant = await createTenant({ slug: "conflito-teste" });
    const service = await createService(tenant, { durationMin: 60 });

    const payload = (phone) => ({
      serviceId: service.id,
      startsAt: "2026-09-02T13:00:00.000Z",
      client: { name: "Cliente", phone },
    });

    const [res1, res2] = await Promise.all([
      request(app).post(`/public/${tenant.slug}/appointments`).send(payload("+5585911111111")),
      request(app).post(`/public/${tenant.slug}/appointments`).send(payload("+5585922222222")),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const conflictResponse = res1.status === 409 ? res1 : res2;
    expect(conflictResponse.body.error.code).toBe("SLOT_UNAVAILABLE");
  });

  test("TC-12: não permite agendar um horário que avança sobre o próximo compromisso", async () => {
    const tenant = await createTenant({ slug: "overlap-teste" });
    const service60 = await createService(tenant, { name: "Serviço 60min", durationMin: 60 });

    // Primeiro agendamento: 13:00 - 14:00
    const first = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({ serviceId: service60.id, startsAt: "2026-09-03T13:00:00.000Z", client: { name: "A", phone: "+5585900000001" } });
    expect(first.status).toBe(201);

    // Segundo agendamento tentando começar às 13:30 (sobreporia até 14:30)
    const second = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({ serviceId: service60.id, startsAt: "2026-09-03T13:30:00.000Z", client: { name: "B", phone: "+5585900000002" } });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("SLOT_UNAVAILABLE");
  });

  test("TC-13: cancelar um agendamento libera o horário novamente na disponibilidade", async () => {
    const tenant = await createTenant({ slug: "cancela-teste" });
    const admin = await require("../helpers/factories").createAdminUser(tenant);
    const token = require("../helpers/factories").signAccessTokenFor(admin);
    const service = await createService(tenant, { durationMin: 30 });

    // 12:00:00.000Z = 09:00 em America/Fortaleza (UTC-3), horário de abertura
    // padrão do tenant - ver correção de fuso horário.
    const created = await request(app)
      .post(`/public/${tenant.slug}/appointments`)
      .send({ serviceId: service.id, startsAt: "2026-09-04T12:00:00.000Z", client: { name: "A", phone: "+5585900000003" } });
    expect(created.status).toBe(201);

    const beforeCancel = await request(app).get(`/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-09-04`);
    expect(beforeCancel.body.slots.some((s) => s.startsAt === "2026-09-04T12:00:00.000Z")).toBe(false);

    const cancelRes = await request(app)
      .delete(`/appointments/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe("cancelado");

    const afterCancel = await request(app).get(`/public/${tenant.slug}/availability?serviceId=${service.id}&date=2026-09-04`);
    expect(afterCancel.body.slots.some((s) => s.startsAt === "2026-09-04T12:00:00.000Z")).toBe(true);
  });
});
