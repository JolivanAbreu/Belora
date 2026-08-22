const { Router } = require("express");
const { Op } = require("sequelize");
const { Client, Appointment, Service } = require("../../models");
const { AppError } = require("../../middlewares/errorHandler");

const router = Router();

router.get("/clients", async (req, res) => {
  const { search } = req.query;
  const where = { tenantId: req.user.tenantId };
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }
  res.json(await Client.findAll({ where, order: [["name", "ASC"]] }));
});

router.get("/clients/:id", async (req, res) => {
  const client = await Client.findOne({
    where: { id: req.params.id, tenantId: req.user.tenantId },
    include: [{ model: Appointment, include: [Service] }],
  });
  if (!client) throw new AppError(404, "CLIENT_NOT_FOUND", "Cliente não encontrado para este tenant.");
  res.json(client);
});

router.patch("/clients/:id", async (req, res) => {
  const client = await Client.findOne({ where: { id: req.params.id, tenantId: req.user.tenantId } });
  if (!client) throw new AppError(404, "CLIENT_NOT_FOUND", "Cliente não encontrado para este tenant.");
  await client.update(req.body);
  res.json(client);
});

module.exports = router;
