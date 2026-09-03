const request = require("supertest");
const { TOTP, Secret } = require("otpauth");
const { resetDatabase, closeDatabase } = require("../helpers/testDb");
const { createTenant, createAdminUser, signAccessTokenFor } = require("../helpers/factories");
const app = require("../../src/app");

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

function totpFor(email, base32Secret) {
  return new TOTP({
    issuer: "Belora",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(base32Secret),
  });
}

describe("2FA - setup e confirmação", () => {
  test("admin consegue iniciar o setup e recebe um QR code", async () => {
    const tenant = await createTenant({ slug: "2fa-setup-teste" });
    const admin = await createAdminUser(tenant, { email: "admin2fa@teste.com" });
    const token = signAccessTokenFor(admin);

    const res = await request(app)
      .post("/auth/2fa/setup")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.secret).toBeTruthy();
    expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  test("confirmar com o código TOTP certo ativa o 2FA e retorna códigos de backup", async () => {
    const tenant = await createTenant({ slug: "2fa-enable-teste" });
    const admin = await createAdminUser(tenant, { email: "admin2fa2@teste.com" });
    const token = signAccessTokenFor(admin);

    const setupRes = await request(app)
      .post("/auth/2fa/setup")
      .set("Authorization", `Bearer ${token}`);

    const validCode = totpFor(admin.email, setupRes.body.secret).generate();

    const enableRes = await request(app)
      .post("/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: validCode });

    expect(enableRes.status).toBe(200);
    expect(enableRes.body.backupCodes).toHaveLength(8);
  });

  test("confirmar com código errado não ativa o 2FA", async () => {
    const tenant = await createTenant({ slug: "2fa-enable-errado-teste" });
    const admin = await createAdminUser(tenant, { email: "admin2fa3@teste.com" });
    const token = signAccessTokenFor(admin);

    await request(app).post("/auth/2fa/setup").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .post("/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TOTP_CODE");
  });
});

describe("2FA - fluxo de login em duas etapas", () => {
  async function setupAndEnable(admin, token) {
    const setupRes = await request(app).post("/auth/2fa/setup").set("Authorization", `Bearer ${token}`);
    const validCode = totpFor(admin.email, setupRes.body.secret).generate();
    const enableRes = await request(app)
      .post("/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: validCode });
    return { secret: setupRes.body.secret, backupCodes: enableRes.body.backupCodes };
  }

  test("login retorna twoFactorRequired quando o admin tem 2FA ativo, sem emitir tokens de acesso ainda", async () => {
    const tenant = await createTenant({ slug: "2fa-login-teste" });
    const admin = await createAdminUser(tenant, { email: "login2fa@teste.com", password: "senha123" });
    const adminToken = signAccessTokenFor(admin);
    await setupAndEnable(admin, adminToken);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login2fa@teste.com", password: "senha123" });

    expect(res.status).toBe(200);
    expect(res.body.twoFactorRequired).toBe(true);
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.twoFactorSessionToken).toBeTruthy();
  });

  test("segunda etapa com código TOTP correto emite os tokens de acesso", async () => {
    const tenant = await createTenant({ slug: "2fa-login-verify-teste" });
    const admin = await createAdminUser(tenant, { email: "login2fa2@teste.com", password: "senha123" });
    const adminToken = signAccessTokenFor(admin);
    const { secret } = await setupAndEnable(admin, adminToken);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "login2fa2@teste.com", password: "senha123" });

    const code = totpFor(admin.email, secret).generate();
    const verifyRes = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ twoFactorSessionToken: loginRes.body.twoFactorSessionToken, code });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.accessToken).toBeTruthy();
    expect(verifyRes.body.refreshToken).toBeTruthy();
  });

  test("segunda etapa com código errado não emite tokens", async () => {
    const tenant = await createTenant({ slug: "2fa-login-verify-errado-teste" });
    const admin = await createAdminUser(tenant, { email: "login2fa3@teste.com", password: "senha123" });
    const adminToken = signAccessTokenFor(admin);
    await setupAndEnable(admin, adminToken);

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "login2fa3@teste.com", password: "senha123" });

    const verifyRes = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ twoFactorSessionToken: loginRes.body.twoFactorSessionToken, code: "000000" });

    expect(verifyRes.status).toBe(401);
  });

  test("código de backup funciona uma vez e depois não pode ser reutilizado", async () => {
    const tenant = await createTenant({ slug: "2fa-backup-teste" });
    const admin = await createAdminUser(tenant, { email: "backup2fa@teste.com", password: "senha123" });
    const adminToken = signAccessTokenFor(admin);
    const { backupCodes } = await setupAndEnable(admin, adminToken);
    const backupCode = backupCodes[0];

    const login1 = await request(app).post("/auth/login").send({ email: "backup2fa@teste.com", password: "senha123" });
    const verify1 = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ twoFactorSessionToken: login1.body.twoFactorSessionToken, code: backupCode });
    expect(verify1.status).toBe(200);

    const login2 = await request(app).post("/auth/login").send({ email: "backup2fa@teste.com", password: "senha123" });
    const verify2 = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ twoFactorSessionToken: login2.body.twoFactorSessionToken, code: backupCode });
    expect(verify2.status).toBe(401);
  });

  test("desativar 2FA exige a senha correta", async () => {
    const tenant = await createTenant({ slug: "2fa-disable-teste" });
    const admin = await createAdminUser(tenant, { email: "disable2fa@teste.com", password: "senha123" });
    const adminToken = signAccessTokenFor(admin);
    await setupAndEnable(admin, adminToken);

    const wrongPasswordRes = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "senha-errada" });
    expect(wrongPasswordRes.status).toBe(401);

    const rightPasswordRes = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "senha123" });
    expect(rightPasswordRes.status).toBe(204);

    // Login volta a ser em uma etapa só
    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email: "disable2fa@teste.com", password: "senha123" });
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.twoFactorRequired).toBeUndefined();
  });
});
