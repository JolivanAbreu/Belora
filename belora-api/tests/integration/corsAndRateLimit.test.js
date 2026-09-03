const request = require("supertest");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createService } = require("../helpers/factories");

describe("CORS - restrição de origem (ALLOWED_ORIGINS)", () => {
  afterEach(async () => {
    delete process.env.ALLOWED_ORIGINS;
    // jest.resetModules() força um novo require de src/config/database.js
    // (e portanto uma nova conexão Sequelize) a cada teste deste bloco -
    // fecha a conexão criada para não vazar handles entre os testes.
    const sequelize = require("../../src/config/database");
    await sequelize.close();
    jest.resetModules();
  });

  test("sem ALLOWED_ORIGINS definida, aceita qualquer origem (dev/test)", async () => {
    delete process.env.ALLOWED_ORIGINS;
    jest.resetModules();
    const app = require("../../src/app");

    const res = await request(app).get("/health").set("Origin", "http://qualquer-lugar.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });

  test("com ALLOWED_ORIGINS definida, origem permitida recebe o header CORS", async () => {
    process.env.ALLOWED_ORIGINS = "https://belora-admin.pages.dev,https://belora-booking.pages.dev";
    jest.resetModules();
    const app = require("../../src/app");

    const res = await request(app).get("/health").set("Origin", "https://belora-admin.pages.dev");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://belora-admin.pages.dev");
  });

  test("com ALLOWED_ORIGINS definida, origem fora da lista não recebe o header CORS", async () => {
    process.env.ALLOWED_ORIGINS = "https://belora-admin.pages.dev";
    jest.resetModules();
    const app = require("../../src/app");

    const res = await request(app).get("/health").set("Origin", "https://site-suspeito.com");
    expect(res.status).toBe(200); // a rota em si responde - o bloqueio é do navegador do cliente
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("Rate limiting nos endpoints públicos", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test("bloqueia após exceder o limite de requisições por IP em endpoint público", async () => {
    const app = require("../../src/app");
    const tenant = await createTenant({ slug: "rate-limit-teste" });
    await createService(tenant);

    const requests = [];
    for (let i = 0; i < 61; i++) {
      requests.push(request(app).get(`/public/${tenant.slug}/services`));
    }
    const responses = await Promise.all(requests);

    const tooManyCount = responses.filter((r) => r.status === 429).length;
    expect(tooManyCount).toBeGreaterThan(0);

    const blocked = responses.find((r) => r.status === 429);
    expect(blocked.body.error.code).toBe("TOO_MANY_REQUESTS");
  });

  test("rotas autenticadas do admin não são afetadas pelo rate limit do público", async () => {
    const app = require("../../src/app");
    const res = await request(app).get("/services"); // sem token, mas não deve ser 429
    expect(res.status).toBe(401); // falta de autenticação, não rate limit
  });
});
