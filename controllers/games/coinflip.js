const userService = require("../../services/user");
const coinFlipHistoryService = require("../../services/coinFlipHistory");

const playCoinFlip = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    const { amount, bet } = req.body;

    if (user.balance.btc < amount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for this bet." });
    }

    const result = Math.random() < 0.5 ? "heads" : "tails";

    if (result === bet) {
      user.balance.btc += amount;
    } else {
      user.balance.btc -= amount;
    }

    await userService.updateUserBalance(user.id, user.balance); // Make sure this is implemented in your userService

    const historyData = {
      userAddress: user.userAddress,
      bet,
      result,
      wager: amount,
      win: result === bet,
      winnings: result === bet ? amount : 0,
    };

    await coinFlipHistoryService.createHistory(historyData);

    res.status(200).json({
      result,
      win: result === bet,
      newBalance: user.balance.btc,
    });
  } catch (error) {
    console.error("Error in playCoinFlip:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getHistory = async (req, res) => {
  try {
    const userAddress = req.params.userAddress;
    const history = await coinFlipHistoryService.findHistory({ userAddress });
    res.status(200).json({
      userAddress,
      history,
    });
  } catch (error) {
    console.error("Error in getHistory:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  playCoinFlip,
  getHistory,
};
