const { Router } = require("express");

const router = Router({ mergeParams: true });

// Expõe apenas o mínimo necessário para a booking page funcionar.
router.get("/info", (req, res) => {
  res.json({ name: req.tenant.name, slug: req.tenant.slug, timezone: req.tenant.timezone });
});

module.exports = router;
