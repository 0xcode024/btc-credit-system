const { verifyMessage: verify } = require("@unisat/wallet-utils");

function verifyMessage(paymentPubkey, message, signature) {
  try {
    result = verify(paymentPubkey, message, signature);
    return result;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
  verifyMessage,
};
