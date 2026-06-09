#!/usr/bin/env node
const fs = require('fs');
const { ethers } = require('ethers');
const CertificateCommitment = require('../src/crypto/commitment');
const MerkleTree = require('../src/crypto/MerkleTree');

function usage() {
  console.log(`
Usage: node scripts/build-tree.js <input.json> [output.json]

Build a Merkle tree from a JSON array of certificate data.

Input format (JSON array):
  [
    {
      "certificateId": "0xabc...",
      "data": { "name": "Alice", "degree": "BSc", ... }
    },
    ...
  ]

If certificateId is omitted, a deterministic ID is derived from the data.

Flags:
  --deterministic   Use deterministic (unsalted) leaves for on-chain verification
  --help            Show this help
`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) usage();

const inputFile = args[0];
const outputFile = args[1] || 'merkle-tree-output.json';
const deterministic = args.includes('--deterministic');

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const certificates = Array.isArray(raw) ? raw : raw.certificates;

if (!Array.isArray(certificates) || certificates.length === 0) {
  console.error('Input must be a non-empty JSON array or object with "certificates" array');
  process.exit(1);
}

const entries = certificates.map((cert, i) => {
  const data = cert.data || cert;
  const dataHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(data, Object.keys(data).sort()))
  );
  const salt = deterministic
    ? '0x0000000000000000000000000000000000000000000000000000000000000000'
    : CertificateCommitment.generateSalt();
  const commitment = deterministic
    ? dataHash
    : ethers.keccak256(ethers.concat([dataHash, salt]));

  return {
    index: i,
    certificateId: cert.certificateId || ethers.keccak256(
      ethers.solidityPacked(['uint256', 'bytes32'], [i, dataHash])
    ),
    data,
    dataHash,
    salt,
    commitment
  };
});

const tree = new MerkleTree(entries.map(e => e.commitment));

const result = {
  algorithm: deterministic ? 'deterministic (unsalted)' : 'salted',
  treeSize: entries.length,
  root: tree.getRoot(),
  entries: entries.map(e => ({
    index: e.index,
    certificateId: e.certificateId,
    data: e.data,
    dataHash: e.dataHash,
    salt: e.salt,
    commitment: e.commitment,
    proof: tree.getProof(e.commitment)
  }))
};

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`Merkle tree built successfully!`);
console.log(`  Root: ${result.root}`);
console.log(`  Leaves: ${result.treeSize}`);
console.log(`  Output: ${outputFile}`);
