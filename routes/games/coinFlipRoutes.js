const express = require("express");
const router = express.Router();
const coinFlipController = require("../../controllers/games/coinflip");
const { authenticate } = require("../../middlewares/auth");
router.post("/play", authenticate, coinFlipController.playCoinFlip);
router.get("/history/:address", coinFlipController.getHistory);

module.exports = router;
