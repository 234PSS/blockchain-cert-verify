const { ethers } = require('ethers');
const { computeSaltedLeaf } = require('./hash');
const MerkleTree = require('./MerkleTree');

class CertificateCommitment {
  static generateSalt() {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  static createSaltedCommitment(certData, salt) {
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(certData, Object.keys(certData).sort()))
    );
    const saltBytes = salt || CertificateCommitment.generateSalt();
    return {
      commitment: computeSaltedLeaf(dataHash, saltBytes),
      dataHash,
      salt: saltBytes
    };
  }

  static createDeterministicCommitment(certData) {
    const dataHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(certData, Object.keys(certData).sort()))
    );
    return { commitment: dataHash, dataHash };
  }

  static buildCertificateMerkleTree(commitments) {
    const leaves = commitments.map(c =>
      typeof c === 'string' ? c : c.commitment
    );
    return new MerkleTree(leaves);
  }

  static createBatchCommitment(certificates) {
    const saltedLeaves = certificates.map(cert => {
      const dataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(cert.data, Object.keys(cert.data).sort()))
      );
      const saltBytes = cert.salt || CertificateCommitment.generateSalt();
      const commitment = ethers.keccak256(ethers.concat([dataHash, saltBytes]));
      return {
        certificateId: cert.certificateId,
        dataHash,
        salt: saltBytes,
        commitment
      };
    });

    const leaves = saltedLeaves.map(l => l.commitment);
    const tree = new MerkleTree(leaves);

    return {
      root: tree.getRoot(),
      leaves: saltedLeaves,
      tree
    };
  }

  static generateBatchProof(certificateId, batchResult) {
    const leaf = batchResult.leaves.find(l => l.certificateId === certificateId);
    if (!leaf) throw new Error(`Certificate ${certificateId} not in batch`);

    const proof = batchResult.tree.getProof(leaf.commitment);
    return {
      leaf: leaf.commitment,
      salt: leaf.salt,
      dataHash: leaf.dataHash,
      proof,
      root: batchResult.root
    };
  }

  static verifyBatchProof(leaf, proof, root) {
    return MerkleTree.verify(leaf, proof, root);
  }
}

module.exports = CertificateCommitment;
