const { ethers } = require('ethers');
const MerkleTree = require('./MerkleTree');


class SelectiveDisclosure {
  static FIELD_SEPARATOR = '||';

  static hashFieldValue(value) {
    return ethers.keccak256(ethers.toUtf8Bytes(String(value)));
  }

  static createFieldTree(fields) {
    const sortedKeys = Object.keys(fields).sort();
    const leaves = sortedKeys.map(key =>
      ethers.keccak256(
        ethers.solidityPacked(['string', 'string'], [key, String(fields[key])])
      )
    );
    return new MerkleTree(leaves);
  }

  static createCommitment(fields) {
    const sortedKeys = Object.keys(fields).sort();
    const concatenated = sortedKeys
      .map(key => `${key}:${JSON.stringify(fields[key])}`)
      .join(SelectiveDisclosure.FIELD_SEPARATOR);
    const fullHash = ethers.keccak256(ethers.toUtf8Bytes(concatenated));
    const tree = SelectiveDisclosure.createFieldTree(fields);
    return {
      fullHash,
      fieldRoot: tree.getRoot(),
      fieldCount: sortedKeys.length,
      fields: sortedKeys,
      tree
    };
  }

  static generateDisclosureProof(fields, fieldsToReveal) {
    const sortedKeys = Object.keys(fields).sort();
    const revealSet = new Set(fieldsToReveal.map(f => f.toLowerCase()));

    const leaves = sortedKeys.map(key => {
      const value = fields[key];
      const leaf = ethers.keccak256(
        ethers.solidityPacked(['string', 'string'], [key, String(value)])
      );
      return { key, value, leaf, reveal: revealSet.has(key.toLowerCase()) };
    });

    const tree = new MerkleTree(leaves.map(l => l.leaf));

    const revealed = [];

    for (let i = 0; i < leaves.length; i++) {
      if (leaves[i].reveal) {
        const proof = tree.getProof(leaves[i].leaf);
        revealed.push({
          key: leaves[i].key,
          value: leaves[i].value,
          leaf: leaves[i].leaf,
          proof
        });
      }
    }

    return {
      root: tree.getRoot(),
      revealed,
      fieldCount: sortedKeys.length
    };
  }

  static verifyDisclosureProof(root, revealedFields) {
    for (const field of revealedFields) {
      const expectedLeaf = ethers.keccak256(
        ethers.solidityPacked(['string', 'string'], [field.key, String(field.value)])
      );
      if (expectedLeaf !== field.leaf) return false;

      if (!MerkleTree.verify(field.leaf, field.proof, root)) return false;
    }
    return true;
  }

  static createSignedCommitment(fields, signerWallet) {
    const { fullHash, fieldRoot, fieldCount } = SelectiveDisclosure.createCommitment(fields);
    const messageHash = ethers.solidityPacked(
      ['bytes32', 'uint256'],
      [fieldRoot, fieldCount]
    );
    const messageBytes = ethers.toUtf8Bytes(
      ethers.hexlify(ethers.concat([fieldRoot, ethers.toBeHex(fieldCount, 32)]))
    );
    return {
      fieldRoot,
      fullHash,
      fieldCount,
      messageHash,
      sign: async () => ({
        fieldRoot,
        fieldCount,
        signature: await signerWallet.signMessage(messageBytes)
      })
    };
  }
}

module.exports = SelectiveDisclosure;
