// transaction model
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  txId: String,
  userId: String,
  hash: String,
  type: { type: String, enum: ["deposit", "withdraw"] },

  assetType: { type: String, enum: ["BTC", "Inscription", "Rune"] },
  assetId: String,
  assetAmount: Number,

  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["psbt", "pending", "confirmed", "completed", "failed"],
    default: "psbt",
  },
  error: String,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
