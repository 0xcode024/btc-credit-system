const userService = require("../../services/user");
const transactionService = require("../../services/transaction");
const btcFunctions = require("../../btc/controllers");

const getPsbtToDepositInscription = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    const { inscriptionId } = req.body;
    const result = await btcFunctions.depositInscription({
      inscriptionId: inscriptionId,
      paymentAddress: user.paymentAddress,
      paymentPubkey: user.paymentPubkey,
      ordinalAddress: user.ordinalAddress,
      ordinalPubkey: user.ordinalPubkey,
    });
    await transactionService.createTransaction({
      hash: hashPsbt(result.psbt.hex),
      type: "deposit",
      assetType: "Inscription",
      assetId: inscriptionId,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const withdrawInscription = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    const { inscriptionId } = req.body;
    if (user.balance.inscriptions.findIndex(inscriptionId) == -1)
      throw new Error("The user has not deposited that inscription");
    else
      user.balance.inscriptions = user.balance.inscriptions.filter(
        (inscription) => inscription !== inscriptionId
      );
    const result = await btcFunctions.withdrawInscription({
      inscriptionId: inscriptionId,
      receiveAddress: user.ordinalAddress,
    });
    console.log("txid:", result);
    await userService.updateUser(user._id, user);

    await transactionService.createTransaction({
      txId: result,
      type: "withdraw",
      assetType: "Inscription",
      assetId: inscriptionId,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPsbtToDepositInscription,
  withdrawInscription,
};
