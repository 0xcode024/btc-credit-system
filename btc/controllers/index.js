const { depositBTC, withdrawBTC } = require("./btc.js");
const { depositInscription, withdrawInscription } = require("./inscription.js");
const { depositRune, withdrawRune } = require("./rune.js");

module.exports = {
  depositBTC,
  withdrawBTC,
  depositInscription,
  withdrawInscription,
  depositRune,
  withdrawRune,
};
