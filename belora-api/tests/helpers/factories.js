const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tenant, User, Service, Client } = require("../../src/models");

async function createTenant(overrides = {}) {
  return Tenant.create({
    name: "Tenant de Teste",
    slug: `tenant-${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  });
}

async function createAdminUser(tenant, overrides = {}) {
  const passwordHash = await bcrypt.hash(overrides.password || "senha123", 4); // custo baixo só para acelerar os testes
  return User.create({
    tenantId: tenant.id,
    email: overrides.email || `admin-${Math.random().toString(36).slice(2, 8)}@teste.com`,
    passwordHash,
    role: "admin",
  });
}

function signAccessTokenFor(user) {
  return jwt.sign(
    { sub: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function createService(tenant, overrides = {}) {
  return Service.create({
    tenantId: tenant.id,
    name: "Serviço de Teste",
    durationMin: 30,
    price: 100,
    active: true,
    ...overrides,
  });
}

async function createClient(tenant, overrides = {}) {
  return Client.create({
    tenantId: tenant.id,
    name: "Cliente de Teste",
    phone: `+5585${Math.floor(100000000 + Math.random() * 899999999)}`,
    ...overrides,
  });
}

module.exports = { createTenant, createAdminUser, signAccessTokenFor, createService, createClient };
