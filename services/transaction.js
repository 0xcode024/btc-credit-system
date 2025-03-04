//service to manage transaction table on database
const Transaction = require("../models/transaction");
//TODO: validation is needed

const createTransaction = async (transactionData) => {
  const transaction = new Transaction(transactionData);
  return await transaction.save();
};

const getTransactions = async () => {
  return await Transaction.find();
};

const getTransactionById = async (id) => {
  return await Transaction.findById(id);
};

const findTransaction = async (criteria) => {
  return await Transaction.findOne(criteria);
};

const findTransactions = async (criteria) => {
  return await Transaction.find(criteria);
};

const updateTransaction = async (id, transactionData) => {
  return await Transaction.findByIdAndUpdate(id, transactionData, {
    new: true,
  });
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  findTransaction,
  findTransactions,
  updateTransaction,
};
