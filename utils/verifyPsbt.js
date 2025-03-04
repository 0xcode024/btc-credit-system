const bitcoin = require("bitcoinjs-lib");
const crypto = require('crypto');
// const hashPsbt = (psbtStr, format = "hex") => {
//   // Parse the PSBT from base64 to JSON
//   let psbt;

//   if (format === "hex") psbt = bitcoin.Psbt.fromHex(psbtStr);
//   else psbt = bitcoin.Psbt.fromBase64(psbtStr);

//   let inputHash = "";
//   psbt.data.inputs.forEach((input) => {
//     console.log({input})
//     // Hash txid and vout (input source)
//     const inputData = `${input.hash.toString("hex")}:${input.index}`;
//     inputHash += inputData;
//   });

//   // Generate a hash of the outputs
//   let outputHash = "";
//   psbt.data.outputs.forEach((output) => {
//     // Hash the amount and scriptPubKey
//     const outputData = `${output.value}:${output.address.toString("hex")}`;
//     outputHash += outputData;
//   });

//   // Combine the input and output hashes into a single string
//   const combinedHash = inputHash + outputHash;

//   // Return the final hash
//   return bitcoin.crypto.sha256(Buffer.from(combinedHash)).toString("hex");
// };

function verifySignedPsbt(originalHash, signedPsbtStr) {
  return hashPsbt(originalHash) === hashFromSignedPsbt(signedPsbtStr);
}

// function hashPsbt(base64String, algorithm = 'sha256') {
//   return crypto.createHash(algorithm)
//                .update(Buffer.from(base64String, 'base64'))
//                .digest('base64'); // You can change 'hex' to 'base64' if needed
// }

// function hashFromSignedPsbt(base64String, algorithm = 'sha256') {
//   base64String = removeAllSignatures(base64String)
//   return crypto.createHash(algorithm)
//                .update(Buffer.from(base64String, 'base64'))
//                .digest('base64'); // You can change 'hex' to 'base64' if needed
// }

// function removeAllSignatures(psbtBase64) {
//   const psbt = bitcoin.Psbt.fromBase64(psbtBase64);

//   // Loop through all inputs and clear signatures
//   psbt.data.inputs.forEach((input, index) => {
//       if (input.partialSig) {
//           delete input.partialSig; // Remove all partial signatures
//       }
//   });

function hashPsbt(base64String, algorithm = 'sha256') {
  return crypto.createHash(algorithm)
               .update(Buffer.from(base64String, 'hex'))
               .digest('hex'); // You can change 'hex' to 'base64' if needed
}

function hashFromSignedPsbt(base64String, algorithm = 'sha256') {
  base64String = removeAllSignatures(base64String)
  return crypto.createHash(algorithm)
               .update(Buffer.from(base64String, 'hex'))
               .digest('hex'); // You can change 'hex' to 'base64' if needed
}

function removeAllSignatures(psbtBase64) {
  const psbt = bitcoin.Psbt.fromHex(psbtBase64);

  // Loop through all inputs and clear signatures
  psbt.data.inputs.forEach((input, index) => {
      if (input.partialSig) {
          delete input.partialSig; // Remove all partial signatures
      }
  });

  return psbt.toHex(); // Return the cleaned PSBT
}


module.exports = {
  hashPsbt,
  hashFromSignedPsbt,
  verifySignedPsbt
};
