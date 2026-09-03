const { Router } = require("express");
const reportsService = require("./reports.service");

const router = Router();

router.get("/reports/summary", async (req, res) => {
  const months = req.query.months ? Number(req.query.months) : 6;
  const summary = await reportsService.getMonthlySummary(req.user.tenantId, months);
  res.json(summary);
});

router.get("/reports/top-services", async (req, res) => {
  const months = req.query.months ? Number(req.query.months) : 6;
  const topServices = await reportsService.getTopServices(req.user.tenantId, months);
  res.json(topServices);
});

module.exports = router;
