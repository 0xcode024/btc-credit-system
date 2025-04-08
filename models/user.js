// user model
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  dateOfBirth: { type: Date },
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
