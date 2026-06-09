#!/usr/bin/env node
const fs = require('fs');
const MerkleTree = require('../src/crypto/MerkleTree');
const SelectiveDisclosure = require('../src/crypto/selectiveDisclosure');

function usage() {
  console.log(`
Usage: node scripts/verify-proof.js <proof.json> [options]

Verify a Merkle inclusion proof.

Options:
  --root <hex>             Override the Merkle root
  --leaf <hex>             Override the leaf hash
  --check-revocation       Check if the certificate is revoked (requires blockchain connection)
  --help                   Show this help
`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) usage();

const proofFile = args[0];
if (!fs.existsSync(proofFile)) {
  console.error(`Proof file not found: ${proofFile}`);
  process.exit(1);
}

const proof = JSON.parse(fs.readFileSync(proofFile, 'utf8'));

const root = args.includes('--root')
  ? args[args.indexOf('--root') + 1]
  : proof.root;
const leaf = args.includes('--leaf')
  ? args[args.indexOf('--leaf') + 1]
  : proof.leaf;

if (!root || !leaf || !proof.proof) {
  console.error('Invalid proof: missing root, leaf, or proof array');
  process.exit(1);
}

const valid = MerkleTree.verify(leaf, proof.proof, root);

const result = {
  valid,
  root,
  leaf,
  proofLength: proof.proof.length,
  certificateId: proof.certificateId || null,
  index: proof.index !== undefined ? proof.index : null
};

if (proof.selectiveDisclosure) {
  const sdValid = SelectiveDisclosure.verifyDisclosureProof(
    proof.selectiveDisclosure.root,
    proof.selectiveDisclosure.revealed
  );
  result.selectiveDisclosureValid = sdValid;
}

console.log(JSON.stringify(result, null, 2));

if (valid) {
  console.log('✓ Proof VALID');
  if (result.selectiveDisclosureValid) {
    console.log('✓ Selective disclosure proof VALID');
  }
} else {
  console.log('✗ Proof INVALID');
  process.exit(1);
}
