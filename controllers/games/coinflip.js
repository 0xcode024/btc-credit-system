const userService = require("../../services/user");
const coinFlipHistoryService = require("../../services/coinFlipHistory");
const { formatNumber } = require("../../utils/number");

const playCoinFlip = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    const { amount, bet, current } = req.body;
    const num = Math.floor(Math.random() * 5) + 1;

    if (user.balance.btc < amount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance for this bet." });
    }

    const result =
      num % 2 === 0 ? current : current === "heads" ? "tails" : "heads";

    if (result === bet) {
      user.balance.btc += Number(amount) * 0.92;
    } else {
      user.balance.btc -= Number(amount);
    }

    await userService.updateUser(user.id, user);

    const historyData = {
      userAddress: user.paymentAddress,
      bet,
      result,
      wager: amount,
      payout: result == bet ? amount * 1.92 : amount,
      win: result === bet,
      winnings: result === bet ? amount : 0,
    };

    await coinFlipHistoryService.createHistory(historyData);

    res.status(200).json({
      result,
      amount,
      payout: result == bet ? amount * 1.92 : amount,
      win: result === bet,
      newBalance: formatNumber(user.balance.btc),
      num,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getHistory = async (req, res) => {
  try {
    const { address } = req.params;
    const history = await coinFlipHistoryService.findHistory({
      userAddress: address,
    });
    res.status(200).json({
      userAddress: address,
      history,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  playCoinFlip,
  getHistory,
};
