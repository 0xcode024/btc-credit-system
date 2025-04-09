//controller to withdraw, deposit and etc ...

const transactionService = require("../services/transaction");
const { pushTransactionHex } = require("../btc/utils/transaction");
const { hashPsbt, hashFromSignedPsbt } = require("../utils/verifyPsbt");

const { Psbt } = require("bitcoinjs-lib");

const pushTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.findTransaction({
      hash: hashFromSignedPsbt(req.body.txHex),
    });
    if (!transaction)
      throw new Error(
        "This psbt is not generated by the cashier service or updated after generated"
      );

    if (transaction.status !== "psbt")
      throw new Error("This psbt has been already pushed");

    const txHex = Psbt.fromHex(req.body.txHex).extractTransaction().toHex();
    const txId = await pushTransactionHex(txHex);

    transaction.txId = txId;
    transaction.status = "pending";
    await transactionService.updateTransaction(transaction._id, transaction);

    res.status(200).json(txId);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const user = req.user;
    const transactions = transactionService.findTransactions({
      userId: user._id,
      status: { $in: ["pending", "confirmed"] },
    });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  pushTransaction,
  getTransactionHistory,
};
