const bitcoinjs = require("bitcoinjs-lib");
const { Psbt } = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { NETWORK_TYPE } = process.env;
const { ECPairFactory } = require("ecpair");

const {
  tweakSigner,
  signPsbt,
  pushTransactionHex,
} = require("../utils/transaction.js");
const { getBtcUtxos } = require("../utils/utxos.js");
const { addInputForFee, getFeeRate } = require("../utils/fee.js");
const { hashPsbt } = require("../../utils/verifyPsbt.js");
const { countNonPushOnlyOPs } = require("bitcoinjs-lib/src/script");

// Initialize ECC Library
bitcoinjs.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const network =
  NETWORK_TYPE === "TESTNET"
    ? bitcoinjs.networks.testnet
    : bitcoinjs.networks.bitcoin;

// Generate random key pairs and tweak signer
const estimateKeyPair = ECPair.makeRandom({ network });
const tweakedEstimateSigner = tweakSigner(estimateKeyPair, { network });

// Retrieve admin data from environment variables
const adminAddress = process.env.ADMIN_ADDRESS;
const wif = process.env.WIF;
const adminSigner = ECPair.fromWIF(wif, network);

/**
 * Deposit BTC Function
 * @param {Object} payload
 * @param {string} payload.paymentAddress
 * @param {string} payload.paymentPubkey
 * @param {number} payload.amount
 * @returns {Promise<Object>}
 */
const depositBTC = async (payload) => {
  const { paymentAddress, paymentPubkey, amount } = payload;
  console.log(
    { paymentAddress },
    { paymentPubkey },
    { amount },
    { adminAddress }
  );

  const btcUtxos = await getBtcUtxos(paymentAddress, paymentPubkey);

  const feeRate = await getFeeRate();
  const toSignInputs = {};
  const psbt = new Psbt({ network });

  psbt.addOutput({
    address: adminAddress,
    value: BigInt(amount),
  });

  addInputForFee(
    psbt,
    toSignInputs,
    0,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    paymentAddress,
    feeRate,
    -amount
  );

  return {
    psbt: {
      base64: psbt.toBase64(),
      hex: psbt.toHex(),
    },
    toSignInputs,
  };
};

/**
 * Withdraw BTC Function
 * @param {Object} payload
 * @param {string} payload.receiveAddress
 * @param {number} payload.amount
 * @returns {Promise<string>}
 */
const withdrawBTC = async (payload) => {
  const { receiveAddress, amount } = payload;

  const pubKey = Buffer.from(adminSigner.publicKey).toString("hex");
  console.log({ receiveAddress }, { amount });

  const btcUtxos = await getBtcUtxos(adminAddress, pubKey);
  const feeRate = await getFeeRate();
  const toSignInputs = {};
  const psbt = new Psbt({ network });

  psbt.addOutput({
    address: receiveAddress,
    value: BigInt(amount),
  });

  addInputForFee(
    psbt,
    toSignInputs,
    0,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    adminAddress,
    feeRate,
    -amount
  );

  signPsbt(psbt, adminSigner, network);
  const txHex = psbt.extractTransaction().toHex();
  console.log({ txHex });

  const txId = await pushTransactionHex(txHex);
  console.log({ txId });
  return txId;
};

module.exports = {
  depositBTC,
  withdrawBTC,
};
