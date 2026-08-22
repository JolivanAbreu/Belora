const { Router } = require("express");
const servicesService = require("./services.service");

const router = Router();

router.get("/services", async (req, res) => {
  res.json(await servicesService.list(req.user.tenantId));
});

router.post("/services", async (req, res) => {
  res.status(201).json(await servicesService.create(req.user.tenantId, req.body));
});

router.patch("/services/:id", async (req, res) => {
  res.json(await servicesService.update(req.user.tenantId, req.params.id, req.body));
});

router.delete("/services/:id", async (req, res) => {
  res.json(await servicesService.deactivate(req.user.tenantId, req.params.id));
});

module.exports = router;
