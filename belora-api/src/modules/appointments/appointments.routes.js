const { Router } = require("express");
const controller = require("./appointments.controller");

const router = Router();

router.get("/appointments", controller.listMine);
router.post("/appointments", controller.createMine);
router.delete("/appointments/:id", controller.cancelMine);

router.post("/availability-blocks", controller.createBlock);
router.get("/availability-blocks", controller.listBlocks);
router.delete("/availability-blocks/:id", controller.deleteBlock);

module.exports = router;
