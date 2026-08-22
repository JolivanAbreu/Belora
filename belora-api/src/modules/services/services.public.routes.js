const { Router } = require("express");
const servicesService = require("./services.service");

const router = Router({ mergeParams: true });

// Montado em app.js sob o prefixo /public/:tenantSlug
router.get("/services", async (req, res) => {
  res.json(await servicesService.listPublic(req.tenantId));
});

module.exports = router;
