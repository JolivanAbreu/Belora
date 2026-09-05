const { Router } = require("express");
const controller = require("./auth.controller");

const router = Router();

// Montado com authMiddleware: exige login para configurar o próprio 2FA.
router.post("/auth/2fa/setup", controller.setupTwoFactor);
router.post("/auth/2fa/enable", controller.enableTwoFactor);
router.post("/auth/2fa/disable", controller.disableTwoFactor);
router.get("/auth/me", controller.getMe);

module.exports = router;
