const { ethers } = require('ethers');

function sortBytes32(a, b) {
  return BigInt(a) < BigInt(b) ? [a, b] : [b, a];
}

function hashPair(a, b) {
  const [left, right] = sortBytes32(a, b);
  return ethers.keccak256(ethers.concat([left, right]));
}

function hashLeaf(value) {
  if (typeof value === 'string' && value.startsWith('0x') && value.length === 66) {
    return value;
  }
  return ethers.keccak256(ethers.toUtf8Bytes(String(value)));
}

function computeSaltedLeaf(dataHash, salt) {
  const data = dataHash.startsWith('0x') ? dataHash : hashLeaf(dataHash);
  const saltBytes = salt.startsWith('0x') ? salt : hashLeaf(salt);
  return ethers.keccak256(ethers.concat([data, saltBytes]));
}

module.exports = { sortBytes32, hashPair, hashLeaf, computeSaltedLeaf };
