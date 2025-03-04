const axios = require("axios");
const { NETWORK_TYPE } = process.env;

const DIVISIBILITY = 8;

// Fetch BTC UTXOs
const getBtcUtxos = async (address, pubkey) => {
  try {
    const btcUtxosResponse = await axios.get(
      `https://wallet-api${
        NETWORK_TYPE === "TESTNET" ? "-testnet" : ""
      }.unisat.io/v5/address/btc-utxo?address=${address}`
    );

    const btcUtxosData = btcUtxosResponse.data;
    const btcUtxos = btcUtxosData.data.map((item) => {
      delete item.height;
      return {
        ...item,
        pubkey,
      };
    });
    return btcUtxos;
  } catch (error) {
    console.error("Error getting BTC UTXOs: ", error);
    throw error;
  }
};

// Fetch Inscription UTXO
const getInscriptionUtxo = async (inscriptionId, pubkey) => {
  try {
    const inscriptionUtxoResponse = await axios.get(
      `https://wallet-api${
        NETWORK_TYPE === "TESTNET" ? "-testnet" : ""
      }.unisat.io/v5/inscription/utxo?inscriptionId=${inscriptionId}`
    );

    if (inscriptionUtxoResponse.data.msg !== "ok") {
      throw new Error(inscriptionUtxoResponse.data.msg);
    }

    return {
      ...inscriptionUtxoResponse.data.data,
      pubkey,
    };
  } catch (error) {
    console.error("Error getting inscription UTXO: ", error);
    throw new Error(error.message);
  }
};

// Fetch Rune UTXOs
const getRuneUtxos = async (address, runeid, pubkey) => {
  try {
    const runeUtxosResponse = await axios.get(
      `https://wallet-api${
        NETWORK_TYPE === "TESTNET" ? "-testnet" : ""
      }.unisat.io/v5/runes/utxos?address=${address}&runeid=${runeid}`
    );

    const runeUtxosData = runeUtxosResponse.data;
    return runeUtxosData.data.map((item) => ({
      ...item,
      pubkey,
    }));
  } catch (error) {
    console.error("Error getting rune UTXOs: ", error);
    throw new Error("Error getting rune UTXOs: " + error.message);
  }
};

// Select UTXOs for a given amount
const selectUtxos = (amount, utxos, type) => {
  const selectedUtxos = [];
  let selectedUtxosAmount = BigInt(0);
  amount = Math.floor(amount * 10 ** DIVISIBILITY);
  const result = {
    changedAmount: BigInt(0),
    utxos: [],
    error: "",
  };

  for (let utxo of utxos) {
    if (amount > selectedUtxosAmount) {
      if (type === "btc") {
        selectedUtxosAmount += BigInt(utxo.satoshis);
      } else {
        selectedUtxosAmount += BigInt(utxo.runes[0].amount);
      }
      selectedUtxos.push(utxo);
    } else {
      break;
    }
  }

  if (amount > selectedUtxosAmount) {
    result.error = `insufficient ${type} utxos`;
  } else {
    result.utxos = selectedUtxos;
    result.changedAmount = selectedUtxosAmount - BigInt(amount);
  }

  return result;
};
module.exports = {
  getBtcUtxos,
  getInscriptionUtxo,
  getRuneUtxos,
  selectUtxos,
};
