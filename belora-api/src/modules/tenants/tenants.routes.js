const { Router } = require("express");
const { Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const router = Router();

// GET /tenant/me - sempre usa req.user.tenantId, nunca um :id na URL
router.get("/tenant/me", async (req, res) => {
  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");
  res.json(tenant);
});

router.patch("/tenant/me", async (req, res) => {
  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");

  const { name, businessHours, timezone } = req.body;
  if (name !== undefined) tenant.name = name;
  if (businessHours !== undefined) tenant.businessHours = businessHours;
  if (timezone !== undefined) tenant.timezone = timezone;
  await tenant.save();

  res.json(tenant);
});

module.exports = router;
