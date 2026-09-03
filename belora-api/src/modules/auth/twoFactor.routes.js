const { Router } = require("express");
const controller = require("./auth.controller");

const router = Router();

// Montado em app.js com authMiddleware - o admin precisa estar logado
// (mesmo sem 2FA ainda) para configurar o 2FA da própria conta.
router.post("/auth/2fa/setup", controller.setupTwoFactor);
router.post("/auth/2fa/enable", controller.enableTwoFactor);
router.post("/auth/2fa/disable", controller.disableTwoFactor);
router.get("/auth/me", controller.getMe);

module.exports = router;
