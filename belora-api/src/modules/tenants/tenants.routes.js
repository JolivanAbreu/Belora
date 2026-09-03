const { Router } = require("express");
const { Op } = require("sequelize");
const { Tenant } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const router = Router();

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// GET /tenant/me - sempre usa req.user.tenantId, nunca um :id na URL
router.get("/tenant/me", async (req, res) => {
  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");
  res.json(tenant);
});

router.patch("/tenant/me", async (req, res) => {
  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant não encontrado.");

  const { name, slug, businessHours, timezone, address, messageTemplates } = req.body;

  if (slug !== undefined && slug !== tenant.slug) {
    if (!SLUG_REGEX.test(slug)) {
      throw new AppError(400, "INVALID_SLUG", "Slug deve conter apenas letras minúsculas, números e hífens.");
    }
    const existing = await Tenant.findOne({ where: { slug, id: { [Op.ne]: tenant.id } } });
    if (existing) {
      throw new AppError(409, "SLUG_TAKEN", "Esse link já está em uso por outro estabelecimento.");
    }
    tenant.slug = slug;
  }

  if (name !== undefined) tenant.name = name;
  if (businessHours !== undefined) tenant.businessHours = businessHours;
  if (timezone !== undefined) tenant.timezone = timezone;
  if (address !== undefined) tenant.address = address;
  if (messageTemplates !== undefined) {
    // Merge raso: permite atualizar só um tipo de template por vez sem
    // precisar reenviar os outros já customizados.
    tenant.messageTemplates = { ...tenant.messageTemplates, ...messageTemplates };
  }
  await tenant.save();

  res.json(tenant);
});

module.exports = router;
