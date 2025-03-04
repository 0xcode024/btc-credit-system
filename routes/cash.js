const express = require("express");
const btcController = require("../controllers/cash/btc");
const inscriptionController = require("../controllers/cash/inscription");
const runeController = require("../controllers/cash/rune");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/btc/deposit", authenticate, btcController.getPsbtToDepositBTC);
router.post("/btc/withdraw", authenticate, btcController.withdrawBTC);
router.post(
  "/inscription/deposit",
  authenticate,
  inscriptionController.getPsbtToDepositInscription
);
router.post(
  "/inscription/withdraw",
  authenticate,
  inscriptionController.withdrawInscription
);
router.post("/rune/deposit", authenticate, runeController.getPsbtToDepositRune);
router.post("/rune/withdraw", authenticate, runeController.withdrawRune);

module.exports = router;
