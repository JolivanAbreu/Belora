const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createAdminUser, signAccessTokenFor } = require("../helpers/factories");
const app = require("../../src/app");

describe("Edição de bloqueios de horário (PATCH /availability-blocks/:id)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  async function createBlock(token, overrides = {}) {
    const res = await request(app)
      .post("/availability-blocks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        startsAt: "2026-09-21T12:00:00",
        endsAt: "2026-09-21T13:00:00",
        reason: "Almoço",
        ...overrides,
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  test("admin consegue editar horário e motivo de um bloqueio existente", async () => {
    const tenant = await createTenant({ slug: "editar-bloqueio-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const block = await createBlock(token);

    const res = await request(app)
      .patch(`/availability-blocks/${block.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startsAt: "2026-09-21T14:00:00", endsAt: "2026-09-21T15:00:00", reason: "Consulta médica" });

    expect(res.status).toBe(200);
    expect(res.body.reason).toBe("Consulta médica");
    expect(new Date(res.body.startsAt).toISOString()).toBe(
      new Date("2026-09-21T14:00:00-03:00").toISOString()
    );
  });

  test("rejeita edição em que o horário final fica antes do inicial", async () => {
    const tenant = await createTenant({ slug: "editar-bloqueio-invalido-teste" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);
    const block = await createBlock(token);

    const res = await request(app)
      .patch(`/availability-blocks/${block.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ startsAt: "2026-09-21T16:00:00", endsAt: "2026-09-21T15:00:00" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RANGE");
  });

  test("admin de um tenant não consegue editar bloqueio de outro tenant", async () => {
    const tenantA = await createTenant({ slug: "bloqueio-tenant-a" });
    const adminA = await createAdminUser(tenantA);
    const tokenA = signAccessTokenFor(adminA);
    const block = await createBlock(tokenA);

    const tenantB = await createTenant({ slug: "bloqueio-tenant-b" });
    const adminB = await createAdminUser(tenantB);
    const tokenB = signAccessTokenFor(adminB);

    const res = await request(app)
      .patch(`/availability-blocks/${block.id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ reason: "Tentativa de outro tenant" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("BLOCK_NOT_FOUND");
  });
});
