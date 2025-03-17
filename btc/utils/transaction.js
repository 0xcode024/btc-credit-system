const axios = require("axios");
const bitcoinjs = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").ECPairFactory;
const ecc = require("tiny-secp256k1");
const { NETWORK_TYPE } = process.env;
const { AddressType, getAddressInfo } = require("bitcoin-address-validation");

const toXOnly = (pubkey) => pubkey.subarray(1, 33);

const ECPair = ECPairFactory(ecc);

// Push transaction to the network
const pushTransactionHex = async (txHex) => {
  try {
    const res = await axios.post(
      `https://mempool.space${
        NETWORK_TYPE === "TESTNET" ? "/testnet" : ""
      }/api/tx`,
      txHex,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.log(err.response?.data);
    return { error: err.response?.data };
  }
};

// Get size from a PSBT (Partially Signed Bitcoin Transaction)
const getSizeFromPsbt = (
  psbt,
  network,
  estimateSigner,
  estimateTweakedSigner,
  paymentAddress,
  changeAmount
) => {
  const estimatedPsbt = psbt.clone();
  const estimatedPsbtWithChange = psbt.clone();

  estimatedPsbt.setMaximumFeeRate(100000000);
  estimatedPsbtWithChange.setMaximumFeeRate(100000000);
  estimatedPsbtWithChange.addOutput({
    address: paymentAddress,
    value: BigInt(changeAmount),
  });

  const internalPubkey = toXOnly(Buffer.from(estimateSigner.publicKey));

  estimatedPsbt.data.inputs.forEach((input, index) => {
    if (input.tapInternalKey && input.witnessUtxo) {
      input.witnessUtxo.script = bitcoinjs.address.toOutputScript(
        bitcoinjs.payments.p2tr({
          internalPubkey,
          network,
        }).address,
        network
      );
      input.tapInternalKey = internalPubkey;
      estimatedPsbt.signInput(index, estimateTweakedSigner);
      estimatedPsbt.finalizeInput(index);
    } else if (!input.finalScriptWitness && input.witnessUtxo) {
      input.witnessUtxo.script = bitcoinjs.address.toOutputScript(
        bitcoinjs.payments.p2wpkh({
          pubkey: estimateSigner.publicKey,
          network,
        }).address,
        network
      );
      input.redeemScript = bitcoinjs.payments.p2wpkh({
        pubkey: estimateSigner.publicKey,
        network,
      }).output;
      estimatedPsbt.signInput(index, estimateSigner);
      estimatedPsbt.finalizeInput(index);
    }
  });

  estimatedPsbtWithChange.data.inputs.forEach((input, index) => {
    if (input.tapInternalKey && input.witnessUtxo) {
      input.witnessUtxo.script = bitcoinjs.address.toOutputScript(
        bitcoinjs.payments.p2tr({
          internalPubkey,
          network,
        }).address,
        network
      );
      input.tapInternalKey = internalPubkey;
      estimatedPsbtWithChange.signInput(index, estimateTweakedSigner);
      estimatedPsbtWithChange.finalizeInput(index);
    } else if (!input.finalScriptWitness && input.witnessUtxo) {
      input.witnessUtxo.script = bitcoinjs.address.toOutputScript(
        bitcoinjs.payments.p2wpkh({
          pubkey: estimateSigner.publicKey,
          network,
        }).address,
        network
      );
      input.redeemScript = bitcoinjs.payments.p2wpkh({
        pubkey: estimateSigner.publicKey,
        network,
      }).output;
      estimatedPsbtWithChange.signInput(index, estimateSigner);
      estimatedPsbtWithChange.finalizeInput(index);
    }
  });

  const transaction = estimatedPsbt.extractTransaction(true);
  const originSize = transaction.virtualSize();

  const transactionWithChange =
    estimatedPsbtWithChange.extractTransaction(true);
  const sizeWithChange = transactionWithChange.virtualSize();

  return { originSize, sizeWithChange };
};

// Tweak a signer for Taproot transactions
const tweakSigner = (signer, opts) => {
  let privateKey = signer.privateKey;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = ecc.privateNegate(privateKey);
  }

  const tweakedPrivateKey = ecc.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(Buffer.from(signer.publicKey)))
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
};

// Taproot tweak hash calculation
const tapTweakHash = (pubKey, h) => {
  return Buffer.from(
    bitcoinjs.crypto.taggedHash(
      "TapTweak",
      Buffer.concat(h ? [pubKey, h] : [pubKey])
    )
  );
};

// Get input for the PSBT based on address type and UTXO
const getInputWithAddressType = (address, utxo) => {
  const addressType = getAddressInfo(address);

  if (addressType.type === AddressType.p2tr) {
    return {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      tapInternalKey: toXOnly(Buffer.from(utxo.pubkey, "hex")),
    };
  } else if (addressType.type === AddressType.p2wpkh) {
    return {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: bitcoinjs.payments.p2wpkh({
          pubkey: Buffer.from(utxo.pubkey, "hex"),
        }).output,
      },
    };
  } else if (addressType.type === AddressType.p2sh) {
    const redeemData = bitcoinjs.payments.p2wpkh({
      pubkey: Buffer.from(utxo.pubkey, "hex"),
    });
    return {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: BigInt(utxo.satoshis),
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      redeemScript: redeemData.output,
    };
  } else {
    throw new Error("Not supported address");
  }
};

// Sign the PSBT (Taproot and P2WPKH)
const signPsbt = (psbt, signer, network) => {
  const tweakedSigner = tweakSigner(signer, {
    network: network,
  });

  psbt.data.inputs.forEach((input, index) => {
    if (input.tapInternalKey) {
      psbt.signInput(index, tweakedSigner);
      psbt.finalizeInput(index);
    } else if (!input.finalScriptWitness) {
      psbt.signInput(index, signer);
      psbt.finalizeInput(index);
    }
  });
};

module.exports = {
  signPsbt,
  getInputWithAddressType,
  pushTransactionHex,
  getSizeFromPsbt,
  tweakSigner,
};
