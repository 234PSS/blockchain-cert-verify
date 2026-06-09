#!/usr/bin/env node
const fs = require('fs');
const CertificateCommitment = require('../src/crypto/commitment');
const SelectiveDisclosure = require('../src/crypto/selectiveDisclosure');

function usage() {
  console.log(`
Usage: node scripts/generate-proof.js <tree-file.json> <certificateId> [output.json]

Generate a Merkle inclusion proof for a certificate.

Flags:
  --selective <fields>   Comma-separated field names for selective disclosure
  --help                 Show this help
`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args.length < 2 || args.includes('--help')) usage();

const treeFile = args[0];
const targetId = args[1];
const outputFile = args.find(a => !a.startsWith('--') && a !== treeFile && a !== targetId) || 'proof-output.json';
const selectiveFields = (() => {
  const idx = args.indexOf('--selective');
  return idx >= 0 ? args[idx + 1]?.split(',').map(s => s.trim()) : null;
})();

if (!fs.existsSync(treeFile)) {
  console.error(`Tree file not found: ${treeFile}`);
  process.exit(1);
}

const treeData = JSON.parse(fs.readFileSync(treeFile, 'utf8'));
const entry = treeData.entries.find(e =>
  e.certificateId === targetId || e.index === Number(targetId)
);

if (!entry) {
  console.error(`Certificate "${targetId}" not found in tree`);
  process.exit(1);
}

const proof = {
  root: treeData.root,
  algorithm: treeData.algorithm,
  leaf: entry.commitment,
  dataHash: entry.dataHash,
  salt: entry.salt,
  proof: entry.proof,
  certificateId: entry.certificateId,
  index: entry.index
};

if (selectiveFields && selectiveFields.length > 0) {
  const disclosure = SelectiveDisclosure.generateDisclosureProof(
    entry.data,
    selectiveFields
  );
  proof.selectiveDisclosure = disclosure;
}

fs.writeFileSync(outputFile, JSON.stringify(proof, null, 2));
console.log(`Proof generated successfully!`);
console.log(`  Certificate: ${proof.certificateId}`);
console.log(`  Root: ${proof.root}`);
console.log(`  Proof length: ${proof.proof.length}`);

const valid = CertificateCommitment.verifyBatchProof(proof.leaf, proof.proof, proof.root);
console.log(`  Self-verify: ${valid ? 'PASS' : 'FAIL'}`);

if (proof.selectiveDisclosure) {
  console.log(`  Selective disclosure fields: ${selectiveFields.join(', ')}`);
}

console.log(`  Output: ${outputFile}`);
