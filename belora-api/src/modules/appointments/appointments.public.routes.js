const { Router } = require("express");
const controller = require("./appointments.controller");

const router = Router({ mergeParams: true });

// Montado em app.js sob o prefixo /public/:tenantSlug
router.get("/availability", controller.getPublicAvailability);
router.post("/appointments", controller.createPublicAppointment);
router.post("/appointments/:id/cancel", controller.cancelPublicAppointment);
router.post("/appointments/:id/confirm-presence", controller.confirmPresencePublicAppointment);

module.exports = router;
