const { Tenant } = require("../models");

/**
 * Middleware usado apenas nas rotas PÚBLICAS da booking page
 * (ex.: GET /public/:tenantSlug/services).
 *
 * Resolve o tenant a partir do slug da URL e injeta req.tenantId.
 * Diferente do middleware de auth, aqui não há usuário logado - mas o
 * tenantId resolvido aqui é o único usado nas queries seguintes, nunca
 * um valor enviado solto no body (ver RF-30 a RF-34 do SRS e TC-04 do
 * Plano de Testes).
 */
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
