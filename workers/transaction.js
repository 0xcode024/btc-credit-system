// here will be a cron job to fetch transaction data from the blockchain and update the database using the services
const mempoolJS = require("@mempool/mempool.js");
const {
  findTransaction,
  updateTransaction,
} = require("../services/transaction");

const { getUserById, updateUser } = require("../services/user");
const { ADMIN_ADDRESS, NETWORK_TYPE } = process.env;
const initTransactionWorker = async (io) => {
  try {
    const connectWebSocket = () => {
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
        try {
          const dataObj = JSON.parse(data.toString());
          console.log({ dataObj });
          if (dataObj["address-transactions"])
            // console.log("status", dataObj["address-transactions"][0].status);
            for (let transaction of dataObj["address-transactions"]) {
              console.log("txs in mempool", transaction);
              if (transaction.status.confirmed) {
                updateTransactionStatus(transaction.txid, "confirmed", io);
              } else {
                updateTransactionStatus(transaction.txid, "pending", io);
              }
            }
          if (dataObj["block-transactions"]) {
            for (let transaction of dataObj["block-transactions"]) {
              console.log("txs in mempool", transaction);
              if (transaction.status.confirmed) {
                updateTransactionStatus(transaction.txid, "confirmed", io);
              } else {
                updateTransactionStatus(transaction.txid, "pending", io);
              }
            }
          }
        } catch (error) {
          console.log("========================================");
          console.log(error);
          console.log("========================================");
        }
      });
      ws.on("open", () => {
        try {
          ws.send(JSON.stringify({ "track-address": ADMIN_ADDRESS }));
          console.log(`Transaction worker is tracking ${ADMIN_ADDRESS}...`);
        } catch (error) {
          console.log("----------------------------------------");
          console.log(error);
          console.log("----------------------------------------");
        }
      });
      ws.on("error", (err) => {
        console.error("WebSocket error:", err);
        // setTimeout(connectWebSocket, 5000);
      });
      ws.on("close", () => {
        console.warn("WebSocket connection closed, reconnecting...");
        // setTimeout(connectWebSocket, 5000);
      });
    };
    connectWebSocket();
  } catch (error) {
    console.log(error);
  }
};

const updateTransactionStatus = async (txId, status, io) => {
  try {
    console.log("txid=>", txId);
    let transaction = await findTransaction({ txId });
    console.log("transaction=>", transaction);

    if (!transaction) {
      return;
    }
    transaction.status = status;
    const method = transaction.type;
    let message = "";
    if (status === "confirmed" && transaction.type === "deposit") {
      const user = await getUserById(transaction.userId);
      console.log("user=>", user);

      if (!user) return;
      if (transaction.assetType === "BTC") {
        user.balance.btc += transaction.assetAmount;
        message = `${
          transaction.assetAmount / 10 ** 8
        } BTC deposited successfully.`;
      } else if (transaction.assetType === "Inscription") {
        user.balance.inscriptions.push(transaction.assetId);
        message = `Inscription ${transaction.assetId} deposited successfully.`;
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
        message = `Rune ${transaction.assetId} (${transaction.assetAmount}) deposited successfully.`;
      }
      await updateUser(user._id, user);
      io.emit("UpdateUser", { user, message });
    } else if (status === "confirmed" && transaction.type === "withdraw") {
      const user = await getUserById(transaction.userId);
      console.log("user=>", user);
      if (!user) return;
      if (transaction.assetType === "BTC") {
        user.balance.btc -= transaction.assetAmount;
        message = `${
          transaction.assetAmount / 10 ** 8
        } BTC successfully withdrawn.`;
      } else if (transaction.assetType === "Inscription") {
        user.balance.inscriptions = user.balance.inscriptions.filter(
          (id) => id !== transaction.assetId
        );
        message = `Inscription ${transaction.assetId} successfully withdrawn.`;
      } else {
        const rune = user.balance.runes.find(
          (rune) => rune.id === transaction.assetId
        );
        if (rune) {
          rune.amount -= transaction.assetAmount;
        } else {
        }
        message = `Rune ${transaction.assetId} (${transaction.assetAmount}) successfully withdrawn.`;
      }
      await updateUser(user._id, user);
      io.emit("UpdateUser", { user, message, method });
    }
    await updateTransaction(transaction._id, transaction);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  initTransactionWorker,
};
