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
const { getBtcUtxos, getInscriptionUtxo } = require("../utils/utxos.js");
const { addInputForFee, getFeeRate } = require("../utils/fee.js");
const { getInputWithAddressType } = require("../utils/transaction.js");

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
 * Deposit Inscription Function
 * @param {Object} payload
 * @param {string} payload.paymentAddress
 * @param {string} payload.paymentPubkey
 * @param {string} payload.ordinalAddress
 * @param {string} payload.ordinalPubkey
 * @param {string} payload.inscriptionId
 * @returns {Promise<Object>}
 */
const depositInscription = async (payload) => {
  const {
    paymentAddress,
    paymentPubkey,
    ordinalAddress,
    ordinalPubkey,
    inscriptionId,
  } = payload;

  console.log(
    { paymentAddress },
    { paymentPubkey },
    { ordinalPubkey },
    { ordinalAddress },
    { inscriptionId },
    { adminAddress }
  );

  const btcUtxos = await getBtcUtxos(paymentAddress, paymentPubkey);
  const inscriptionUtxo = await getInscriptionUtxo(
    inscriptionId,
    ordinalPubkey
  );
  const feeRate = await getFeeRate();
  const toSignInputs = {};
  const psbt = new Psbt({ network });

  psbt.addInput(getInputWithAddressType(ordinalAddress, inscriptionUtxo));
  toSignInputs[ordinalAddress] = [0];

  psbt.addOutput({
    address: adminAddress,
    value: BigInt(inscriptionUtxo.satoshis),
  });

  addInputForFee(
    psbt,
    toSignInputs,
    1,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    paymentAddress,
    feeRate,
    0
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
 * Withdraw Inscription Function
 * @param {Object} payload
 * @param {string} payload.receiveAddress
 * @param {string} payload.inscriptionId
 * @returns {Promise<string>}
 */
const withdrawInscription = async (payload) => {
  const { receiveAddress, inscriptionId } = payload;

  const pubKey = Buffer.from(adminSigner.publicKey).toString("hex");
  console.log({ receiveAddress }, { inscriptionId }, { adminAddress });

  const btcUtxos = await getBtcUtxos(adminAddress, pubKey);
  const inscriptionUtxo = await getInscriptionUtxo(inscriptionId, pubKey);

  const feeRate = await getFeeRate();
  const psbt = new Psbt({ network });
  const toSignInputs = {};

  psbt.addInput(getInputWithAddressType(adminAddress, inscriptionUtxo));

  psbt.addOutput({
    address: receiveAddress,
    value: BigInt(inscriptionUtxo.satoshis),
  });

  addInputForFee(
    psbt,
    toSignInputs,
    1,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    adminAddress,
    feeRate,
    0
  );

  signPsbt(psbt, adminSigner, network);
  const txHex = psbt.extractTransaction().toHex();
  console.log({ txHex });

  const txId = await pushTransactionHex(txHex);
  return txId;
};

module.exports = {
  depositInscription,
  withdrawInscription,
};
