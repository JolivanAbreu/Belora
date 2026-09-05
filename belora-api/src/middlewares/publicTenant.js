const { Tenant } = require("../models");

// Rotas públicas da booking page: resolve o tenant pelo slug da URL.
// O tenantId resolvido aqui é o único usado nas queries seguintes.
async function publicTenantMiddleware(req, res, next) {
  const { tenantSlug } = req.params;

  const tenant = await Tenant.findOne({ where: { slug: tenantSlug } });

  if (!tenant) {
    return res.status(404).json({ error: { code: "TENANT_NOT_FOUND", message: "Página de agendamento não encontrada." } });
  }

  req.tenant = tenant;
  req.tenantId = tenant.id;

  return next();
}

module.exports = publicTenantMiddleware;
