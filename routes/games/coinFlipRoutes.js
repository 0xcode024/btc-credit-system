const express = require("express");
const router = express.Router();
const coinFlipController = require("../../controllers/games/coinflip");

router.post("/play", coinFlipController.playCoinFlip);
router.get("/history/:userAddress", coinFlipController.getHistory);

module.exports = router;
