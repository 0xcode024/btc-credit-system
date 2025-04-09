const userService = require("../../services/user");
const transactionService = require("../../services/transaction");
const btcFunctions = require("../../btc/controllers");
const { hashPsbt } = require("../../utils/verifyPsbt");

const getPsbtToDepositRune = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    const { runeId, amount } = req.body;

    const result = await btcFunctions.depositRune({
      runeId: runeId,
      depositAmount: amount,
      paymentAddress: user.paymentAddress,
      paymentPubkey: user.paymentPubkey,
      ordinalAddress: user.ordinalAddress,
      ordinalPubkey: user.ordinalPubkey,
    });

    await transactionService.createTransaction({
      txId: hashPsbt(result.psbt.hex),
      type: "deposit",
      assetType: "Rune",
      assetId: runeId,
      assetAmount: amount,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const withdrawRune = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    const { runeId, amount } = req.body;
    const runeIndex = user.balance.runes.findIndex((item) => item.id == runeId);

    if (runeIndex === -1 || user.balance.runes[runeIndex].amount < amount)
      throw new Error("The user does not have enough Rune to withdraw");
    else user.balance.runes[runeIndex].amount -= amount;

    const result = await btcFunctions.withdrawRune({
      runeId: runeId,
      withdrawAmount: amount,
      receiveAddress: user.ordinalAddress,
    });

    await userService.updateUser(user._id, user);

    await transactionService.createTransaction({
      txId: result,
      type: "withdraw",
      assetType: "Rune",
      assetId: runeId,
      assetAmount: amount,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPsbtToDepositRune,
  withdrawRune,
};
