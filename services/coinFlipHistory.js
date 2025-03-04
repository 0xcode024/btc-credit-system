const CoinFlipHistory = require("../models/history/CoinFlipHistory");
//TODO: validation is needed

const createHistory = async (userData) => {
  const user = new CoinFlipHistory(userData);
  return await user.save();
};

const getHistorys = async () => {
  return await CoinFlipHistory.find();
};

const getHistoryById = async (id) => {
  return await CoinFlipHistory.findById(id);
};

const findHistory = async (criteria) => {
  return await CoinFlipHistory.find(criteria);
};

const updateHistory = async (id, userData) => {
  return await CoinFlipHistory.findByIdAndUpdate(id, userData, { new: true });
};

const deleteHistory = async (id) => {
  return await CoinFlipHistory.findByIdAndDelete(id);
};

module.exports = {
  createHistory,
  getHistorys,
  getHistoryById,
  updateHistory,
  deleteHistory,
  findHistory,
};
