const { Router } = require("express");

const router = Router({ mergeParams: true });

// Montado em app.js sob o prefixo /public/:tenantSlug (publicTenantMiddleware
// já resolveu req.tenant). Expõe só o mínimo necessário para a booking page
// funcionar - nome e fuso horário para formatar horários corretamente.
router.get("/info", (req, res) => {
  res.json({ name: req.tenant.name, slug: req.tenant.slug, timezone: req.tenant.timezone });
});

module.exports = router;
