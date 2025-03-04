// user model
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  userAddress: { type: String },
  balance: {
    btc: { type: Number, default: 0 },
    inscriptions: [{ type: String }],
    runes: [
      {
        id: { type: String },
        amount: { type: Number },
      },
    ],
  },
  paymentAddress: { type: String },
  paymentPubkey: { type: String },
  ordinalAddress: { type: String },
  ordinalPubkey: { type: String },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
