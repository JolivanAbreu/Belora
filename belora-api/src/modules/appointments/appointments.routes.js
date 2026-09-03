const { Router } = require("express");
const controller = require("./appointments.controller");

const router = Router();

router.get("/appointments", controller.listMine);
router.post("/appointments", controller.createMine);
router.delete("/appointments/:id", controller.cancelMine);
router.patch("/appointments/:id/status", controller.updateStatus);
router.delete("/appointments/:id/permanent", controller.deleteMinePermanently);

router.post("/availability-blocks", controller.createBlock);
router.get("/availability-blocks", controller.listBlocks);
router.patch("/availability-blocks/:id", controller.updateBlock);
router.delete("/availability-blocks/:id", controller.deleteBlock);

module.exports = router;
