const axios = require("axios");
const { NETWORK_TYPE } = process.env;
const { getSizeFromPsbt, getInputWithAddressType } = require("./transaction");

// Fetch fee rate from mempool.space
const getFeeRate = async () => {
  try {
    const res = await axios.get(
      `https://mempool.space${
        NETWORK_TYPE === "TESTNET" ? "/testnet" : ""
      }/api/v1/fees/recommended`
    );
    return res.data.halfHourFee;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Add inputs to the PSBT to cover fees
const addInputForFee = (
  psbt,
  toSignInputs,
  currentInputIndex,
  btcUtxos,
  network,
  estimateKeyPair,
  tweakedEstimateSigner,
  paymentAddress,
  feeRate,
  changeAmount
) => {
  let i = 0;

  console.log({ btcUtxos });
  if (btcUtxos.length == 0) throw new Error("Insufficient Bitcoin utxos");
  for (let utxo of btcUtxos) {
    const input = getInputWithAddressType(paymentAddress, utxo);
    psbt.addInput(input);
    console.log({ utxo });
    if (toSignInputs[paymentAddress] === undefined) {
      toSignInputs[paymentAddress] = [];
    }
    toSignInputs[paymentAddress].push(currentInputIndex++);
    changeAmount += utxo.satoshis;

    if (changeAmount >= 0) {
      const { originSize, sizeWithChange } = getSizeFromPsbt(
        psbt,
        network,
        estimateKeyPair,
        tweakedEstimateSigner,
        paymentAddress,
        changeAmount
      );
      console.log({ originSize }, { sizeWithChange });

      if (changeAmount > sizeWithChange * feeRate + 546) {
        changeAmount = changeAmount - sizeWithChange * feeRate;
        break;
      } else if (changeAmount === originSize * feeRate) {
        changeAmount = 0;
        break;
      }
    }

    i++;
    if (btcUtxos[i + 1] === undefined) {
      throw new Error("Insufficient Bitcoin utxos");
    }
  }

  if (changeAmount >= 546) {
    psbt.addOutput({ address: paymentAddress, value: BigInt(changeAmount) });
  }
};

module.exports = {
  getFeeRate,
  addInputForFee,
};
