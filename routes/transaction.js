//api routes to withdraw, deposit and etc ...
const express = require("express");
const transactionController = require("../controllers/transaction");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/push", authenticate, transactionController.pushTransaction);
router.get(
  "/history",
  authenticate,
  transactionController.getTransactionHistory
);

module.exports = router;
