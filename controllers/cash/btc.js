const userService = require("../../services/user");
const transactionService = require("../../services/transaction");
const btcFunctions = require("../../btc/controllers");
const { hashPsbt } = require("../../utils/verifyPsbt");

const getPsbtToDepositBTC = async (req, res) => {
  try {
    console.log("req.user", req.user);
    const user = await userService.getUserById(req.user.id);
    const { amount } = req.body;
    const result = await btcFunctions.depositBTC({
      amount: amount,
      paymentAddress: user.paymentAddress,
      paymentPubkey: user.paymentPubkey,
    });
    const hash = hashPsbt(result.psbt.hex);
    await transactionService.createTransaction({
      userId: req.user.id,
      hash: hash,
      type: "deposit",
      assetType: "BTC",
      assetAmount: amount,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const withdrawBTC = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    const { amount } = req.body;
    if (amount > user.balance.btc)
      throw new Error("The user does not have enough BTC to withdraw");
    else user.balance.btc -= amount;
    const result = await btcFunctions.withdrawBTC({
      amount: amount,
      receiveAddress: user.paymentAddress,
    });
    console.log("txid:", result);

    await userService.updateUser(user._id, user);

    await transactionService.createTransaction({
      userId: req.user.id,
      txId: result,
      type: "withdraw",
      assetType: "BTC",
      assetAmount: amount,
      status: "pending",
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPsbtToDepositBTC,
  withdrawBTC,
};

//TODO: fee issue when users withdraw
//     and maybe use another field for pending amount for smooth process?
