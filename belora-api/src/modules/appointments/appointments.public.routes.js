const { Router } = require("express");
const controller = require("./appointments.controller");

const router = Router({ mergeParams: true });

// Montado em app.js sob o prefixo /public/:tenantSlug
router.get("/availability", controller.getPublicAvailability);
router.post("/appointments", controller.createPublicAppointment);

module.exports = router;
