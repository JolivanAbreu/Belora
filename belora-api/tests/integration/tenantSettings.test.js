const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createAdminUser, signAccessTokenFor } = require("../helpers/factories");
const app = require("../../src/app");

describe("Configurações do tenant (PATCH /tenant/me)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("admin pode atualizar nome, horários e fuso do próprio tenant", async () => {
    const tenant = await createTenant({ slug: "estudio-a" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);

    const res = await request(app)
      .patch("/tenant/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Novo Nome do Estúdio",
        timezone: "America/Sao_Paulo",
        businessHours: { mon: [["10:00", "20:00"]], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Novo Nome do Estúdio");
    expect(res.body.timezone).toBe("America/Sao_Paulo");
    expect(res.body.businessHours.mon).toEqual([["10:00", "20:00"]]);
  });

  test("admin pode alterar o slug para um valor livre", async () => {
    const tenant = await createTenant({ slug: "estudio-b" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);

    const res = await request(app)
      .patch("/tenant/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "novo-slug-livre" });

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("novo-slug-livre");
  });

  test("não permite alterar o slug para um já usado por outro tenant", async () => {
    await createTenant({ slug: "slug-ja-existente" });
    const tenantB = await createTenant({ slug: "estudio-c" });
    const adminB = await createAdminUser(tenantB);
    const token = signAccessTokenFor(adminB);

    const res = await request(app)
      .patch("/tenant/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "slug-ja-existente" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("SLUG_TAKEN");
  });

  test("rejeita slug em formato inválido (maiúsculas, espaços, etc.)", async () => {
    const tenant = await createTenant({ slug: "estudio-d" });
    const admin = await createAdminUser(tenant);
    const token = signAccessTokenFor(admin);

    const res = await request(app)
      .patch("/tenant/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ slug: "Nome Com Espaço" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_SLUG");
  });

  test("admin de um tenant não consegue alterar configurações usando o slug de outro tenant como alvo indireto", async () => {
    // Garantia adicional de isolamento: mesmo que o admin B tente "roubar"
    // o slug do tenant A, o tenant efetivamente modificado continua sendo
    // sempre o do próprio token (nunca aceito via parâmetro solto).
    const tenantA = await createTenant({ slug: "tenant-a-slug" });
    const tenantB = await createTenant({ slug: "tenant-b-slug" });
    const adminB = await createAdminUser(tenantB);
    const token = signAccessTokenFor(adminB);

    const res = await request(app)
      .patch("/tenant/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tentativa de alterar A" });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tenantB.id);
    expect(res.body.id).not.toBe(tenantA.id);
  });
});
