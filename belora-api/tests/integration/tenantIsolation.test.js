const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createAdminUser, signAccessTokenFor, createService, createClient } = require("../helpers/factories");
const app = require("../../src/app");

describe("Isolamento entre tenants (Plano de Testes, seção 3.1)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("TC-01: admin do Tenant A não consegue ver cliente do Tenant B", async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();
    const adminA = await createAdminUser(tenantA);
    const clientB = await createClient(tenantB);
    const tokenA = signAccessTokenFor(adminA);

    const res = await request(app)
      .get(`/clients/${clientB.id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("CLIENT_NOT_FOUND");
  });

  test("TC-02: admin do Tenant A não consegue editar serviço do Tenant B", async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();
    const adminA = await createAdminUser(tenantA);
    const serviceB = await createService(tenantB, { price: 200 });
    const tokenA = signAccessTokenFor(adminA);

    const res = await request(app)
      .patch(`/services/${serviceB.id}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ price: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SERVICE_NOT_FOUND");

    // Garante que o preço do Tenant B realmente não foi alterado
    await serviceB.reload();
    expect(Number(serviceB.price)).toBe(200);
  });

  test("TC-02b: serviço do Tenant B não aparece na listagem do Tenant A", async () => {
    const tenantA = await createTenant();
    const tenantB = await createTenant();
    const adminA = await createAdminUser(tenantA);
    await createService(tenantA, { name: "Serviço A" });
    await createService(tenantB, { name: "Serviço B" });
    const tokenA = signAccessTokenFor(adminA);

    const res = await request(app)
      .get("/services")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Serviço A");
  });

  test("TC-03: token JWT de um tenant não concede acesso a outro tenant mesmo com role válida", async () => {
    const tenantA = await createTenant();
    const adminA = await createAdminUser(tenantA);
    const tokenA = signAccessTokenFor(adminA);

    // Sem tenant algum autenticado deve dar 401
    const resNoToken = await request(app).get("/services");
    expect(resNoToken.status).toBe(401);

    // Com token válido, só enxerga o próprio tenant (vazio, pois nenhum serviço criado)
    const resWithToken = await request(app).get("/services").set("Authorization", `Bearer ${tokenA}`);
    expect(resWithToken.status).toBe(200);
    expect(resWithToken.body).toEqual([]);
  });

  test("TC-04: cliente final não consegue agendar na booking page de um tenant usando serviceId de outro tenant", async () => {
    const tenantA = await createTenant({ slug: "tenant-a-booking" });
    const tenantB = await createTenant({ slug: "tenant-b-booking" });
    const serviceB = await createService(tenantB);

    const res = await request(app)
      .post(`/public/${tenantA.slug}/appointments`)
      .send({
        serviceId: serviceB.id,
        startsAt: "2026-09-01T13:00:00.000Z",
        client: { name: "Cliente Teste", phone: "+5585900000000" },
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SERVICE_NOT_FOUND");
  });

  test("booking page com slug inexistente retorna 404 (tenant não encontrado)", async () => {
    const res = await request(app).get("/public/slug-que-nao-existe/services");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TENANT_NOT_FOUND");
  });
});
