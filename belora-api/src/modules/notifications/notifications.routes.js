const { Router } = require("express");
const notificationsService = require("./notifications.service");

const router = Router();

router.get("/notifications-log", async (req, res) => {
  const { appointmentId } = req.query;
  const logs = await notificationsService.list(req.user.tenantId, { appointmentId });
  res.json(logs);
});

module.exports = router;
