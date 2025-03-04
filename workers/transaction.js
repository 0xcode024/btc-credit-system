// here will be a cron job to fetch transaction data from the blockchain and update the database using the services
const mempoolJS = require("@mempool/mempool.js");
const {
  findTransaction,
  updateTransaction,
} = require("../services/transaction");

const { getUserById, updateUser } = require("../services/user");
const { ADMIN_ADDRESS, NETWORK_TYPE } = process.env;
const initTransactionWorker = async () => {
  try {
    const {
      bitcoin: { websocket },
    } = mempoolJS(
      NETWORK_TYPE === "TESTNET"
        ? {
            hostname: "mempool.space",
            network: "testnet",
          }
        : {
            hostname: "mempool.space",
          }
    );

    const ws = websocket.initServer({});
    ws.addEventListener("message", function incoming({ data }) {
      const dataObj = JSON.parse(data.toString());
      console.log({ dataObj });
      if (dataObj["address-transactions"])
        // console.log("status", dataObj["address-transactions"][0].status);
        for (let transaction of dataObj["address-transactions"]) {
          if (transaction.status.confirmed) {
            updateTransactionStatus(transaction.txId, "confirmed");
          } else {
            updateTransactionStatus(transaction.txId, "pending");
          }
        }
      if (dataObj["block-transactions"]) {
        for (let transaction of dataObj["block-transactions"]) {
          if (transaction.status.confirmed) {
            updateTransactionStatus(transaction.txId, "confirmed");
          } else {
            updateTransactionStatus(transaction.txId, "pending");
          }
        }
      }
    });
    ws.on("open", () => {
      ws.send(JSON.stringify({ "track-address": ADMIN_ADDRESS }));
      console.log(`Transaction worker is tracking ${ADMIN_ADDRESS}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

const updateTransactionStatus = async (txId, status) => {
  let transaction = await findTransaction({ txId });
  if (!transaction) {
    return;
  }
  transaction.status = status;
  if (status === "confirmed" && transaction.type === "deposit") {
    const user = await getUserById(transaction.userId);
    if (transaction.assetType === "BTC") {
      user.balance.btc += transaction.assetAmount;
    } else if (transaction.assetType === "Inscription") {
      user.balance.inscriptions.push(transaction.assetId);
    } else {
      const rune = user.balance.runes.find(
        (rune) => rune.id === transaction.assetId
      );
      if (rune) {
        rune.amount += transaction.assetAmount;
      } else {
        user.balance.runes.push({
          id: transaction.assetId,
          amount: transaction.assetAmount,
        });
      }
    }
    await updateUser(user._id, user);
  }
  await updateTransaction(transaction._id, transaction);
};

module.exports = {
  initTransactionWorker,
};
