// CoinFlip  model
const mongoose = require("mongoose");

const coinFlipHistorySchema = new mongoose.Schema({
  userAddress: { type: String, required: true },
  bet: {
    type: String,
    enum: ["heads", "tails"],
    required: true,
  },
  result: {
    type: String,
    enum: ["heads", "tails"],
    required: true,
  },
  wager: {
    type: Number,
    required: true,
  },
  payout: {
    type: Number,
    required: true, // How much the user won or lost
  },
  win: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CoinFlipHistory = mongoose.model(
  "CoinFlip_History",
  coinFlipHistorySchema
);

module.exports = CoinFlipHistory;
