const bitcoinjs = require("bitcoinjs-lib");
const { Psbt } = require("bitcoinjs-lib");
const ecc = require("tiny-secp256k1");
const { DUST_AMOUNT } = require("../config.js");
const { NETWORK_TYPE } = process.env;
const { ECPairFactory } = require("ecpair");

const { RuneId, Runestone, none, some, Edict } = require("runelib");

const {
  tweakSigner,
  signPsbt,
  pushTransactionHex,
} = require("../utils/transaction.js");
const { getBtcUtxos, getRuneUtxos } = require("../utils/utxos.js");
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
 * Deposit Rune Function
 * @param {Object} payload
 * @param {string} payload.paymentAddress
 * @param {string} payload.paymentPubkey
 * @param {string} payload.ordinalAddress
 * @param {string} payload.ordinalPubkey
 * @param {string} payload.runeId
 * @param {number} payload.depositAmount
 * @returns {Promise<Object>}
 */
const depositRune = async (payload) => {
  const {
    paymentAddress,
    paymentPubkey,
    ordinalAddress,
    ordinalPubkey,
    runeId,
    depositAmount,
  } = payload;

  console.log(
    { paymentAddress },
    { paymentPubkey },
    { ordinalPubkey },
    { ordinalAddress },
    { runeId },
    { adminAddress }
  );

  const btcUtxos = await getBtcUtxos(paymentAddress, paymentPubkey);
  const runeUtxos = await getRuneUtxos(ordinalAddress, runeId, ordinalPubkey);

  const feeRate = await getFeeRate();
  const toSignInputs = {};
  const psbt = new Psbt({ network });
  let involvedAmount = 0;
  let involvedCount = 0;
  let changeAmount = 0;
  toSignInputs[ordinalAddress] = [];
  // let depositAmountWithDivisibility = 0;

  for (const [index, runeUtxo] of runeUtxos.entries()) {
    // if (index === 0) {
    //   depositAmountWithDivisibility =
    //     depositAmount * 10 ** runeUtxo.runes[0].divisibility;
    // }
    psbt.addInput(getInputWithAddressType(ordinalAddress, runeUtxo));
    toSignInputs[ordinalAddress].push(index);
    involvedAmount += Number(runeUtxo.runes[0].amount);
    involvedCount++;
    changeAmount += runeUtxo.satoshis;
    if (involvedAmount >= depositAmount) break;
  }

  if (involvedAmount < depositAmount) {
    throw Error("Insufficient Rune Amount");
  }

  if (involvedAmount > depositAmount) {
    const edicts = [];
    const runeID = new RuneId(
      Number(runeId.split(":")[0]),
      Number(runeId.split(":")[1])
    );
    const edictSend = new Edict(runeID, BigInt(depositAmount), 1);
    edicts.push(edictSend);

    const mintstone = new Runestone(edicts, none(), none(), some(2));
    psbt.addOutput({
      script: mintstone.encipher(),
      value: BigInt(0),
    });
    psbt.addOutput({
      address: adminAddress,
      value: BigInt(DUST_AMOUNT),
    });
    psbt.addOutput({
      address: ordinalAddress,
      value: BigInt(DUST_AMOUNT),
    });
    changeAmount -= DUST_AMOUNT * 2;
  } else {
    psbt.addOutput({
      address: adminAddress,
      value: BigInt(DUST_AMOUNT),
    });
    changeAmount -= DUST_AMOUNT;
  }

  addInputForFee(
    psbt,
    toSignInputs,
    involvedCount,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    paymentAddress,
    feeRate,
    changeAmount
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
 * Withdraw Rune Function
 * @param {Object} payload
 * @param {string} payload.receiveAddress
 * @param {string} payload.runeId
 * @param {number} payload.withdrawAmount
 * @returns {Promise<string>}
 */
const withdrawRune = async (payload) => {
  const { runeId, withdrawAmount, receiveAddress } = payload;
  console.log({ runeId }, { withdrawAmount }, { receiveAddress });

  const pubKey = Buffer.from(adminSigner.publicKey).toString("hex");
  const btcUtxos = await getBtcUtxos(adminAddress, pubKey);
  const runeUtxos = await getRuneUtxos(adminAddress, runeId, pubKey);

  const feeRate = await getFeeRate();
  const toSignInputs = {};
  const psbt = new Psbt({ network });
  let involvedAmount = 0;
  let involvedCount = 0;
  let changeAmount = 0;
  toSignInputs[adminAddress] = [];
  let withdrawAmountWithDivisibility = 0;

  for (const [index, runeUtxo] of runeUtxos.entries()) {
    if (index === 0) {
      withdrawAmountWithDivisibility =
        withdrawAmount * 10 ** runeUtxo.runes[0].divisibility;
    }
    psbt.addInput(getInputWithAddressType(adminAddress, runeUtxo));
    toSignInputs[adminAddress].push(index);
    involvedAmount += Number(runeUtxo.runes[0].amount);
    involvedCount++;
    changeAmount += runeUtxo.satoshis;
    if (involvedAmount >= withdrawAmountWithDivisibility) break;
  }

  if (involvedAmount < withdrawAmountWithDivisibility) {
    throw Error("Insufficient Rune Amount");
  }

  if (involvedAmount > withdrawAmountWithDivisibility) {
    const edicts = [];
    const runeID = new RuneId(
      Number(runeId.split(":")[0]),
      Number(runeId.split(":")[1])
    );
    const edictSend = new Edict(
      runeID,
      BigInt(withdrawAmountWithDivisibility),
      1
    );
    edicts.push(edictSend);

    const mintstone = new Runestone(edicts, none(), none(), some(2));
    psbt.addOutput({
      script: mintstone.encipher(),
      value: BigInt(0),
    });
    psbt.addOutput({
      address: receiveAddress,
      value: BigInt(DUST_AMOUNT),
    });
    psbt.addOutput({
      address: adminAddress,
      value: BigInt(DUST_AMOUNT),
    });
    changeAmount -= DUST_AMOUNT * 2;
  } else {
    psbt.addOutput({
      address: receiveAddress,
      value: BigInt(DUST_AMOUNT),
    });
    changeAmount -= DUST_AMOUNT;
  }

  addInputForFee(
    psbt,
    toSignInputs,
    involvedCount,
    btcUtxos,
    network,
    estimateKeyPair,
    tweakedEstimateSigner,
    adminAddress,
    feeRate,
    changeAmount
  );

  signPsbt(psbt, adminSigner, network);
  const txHex = psbt.extractTransaction().toHex();
  console.log({ txHex });

  const txId = await pushTransactionHex(txHex);
  return txId;
};

module.exports = {
  depositRune,
  withdrawRune,
};
