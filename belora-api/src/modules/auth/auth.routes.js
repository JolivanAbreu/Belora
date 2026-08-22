const { Router } = require("express");
const controller = require("./auth.controller");

const router = Router();

router.post("/auth/login", controller.login);
router.post("/auth/refresh", controller.refresh);

module.exports = router;
