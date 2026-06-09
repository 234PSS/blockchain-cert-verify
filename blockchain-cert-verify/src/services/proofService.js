const CertificateCommitment = require('../crypto/commitment');
const SelectiveDisclosure = require('../crypto/selectiveDisclosure');
const MerkleTree = require('../crypto/MerkleTree');
const { computeSaltedLeaf, hashLeaf } = require('../crypto/hash');

class ProofService {
  constructor(blockchainService) {
    this.blockchain = blockchainService;
  }

  async generateCommitmentProof(certificateId, certData, issuerAddress) {
    const { root, timestamp } = await this.blockchain.getIssuerMerkleRoot(issuerAddress);
    if (root === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      throw new Error('Issuer has no Merkle root set');
    }

    const salt = CertificateCommitment.generateSalt();
    const { commitment } = CertificateCommitment.createSaltedCommitment(certData, salt);

    return {
      certificateId,
      commitment,
      salt,
      issuerAddress,
      root,
      rootTimestamp: timestamp
    };
  }

  async verifyCommitmentProof(commitment, proof, issuerAddress) {
    return this.blockchain.verifyByMerkleProof(commitment, proof, issuerAddress);
  }

  async generateSelectiveDisclosure(certData, fieldsToReveal) {
    return SelectiveDisclosure.generateDisclosureProof(certData, fieldsToReveal);
  }

  verifySelectiveDisclosure(root, revealedFields) {
    return SelectiveDisclosure.verifyDisclosureProof(root, revealedFields);
  }

  static verifyMerkleInclusion(leaf, proof, root) {
    return MerkleTree.verify(leaf, proof, root);
  }

  async generateBackendBatchProof(certificateIds, certificates) {
    const batchResult = CertificateCommitment.createBatchCommitment(
      certificates.map((cert, i) => ({
        certificateId: certificateIds[i],
        data: cert,
        salt: CertificateCommitment.generateSalt()
      }))
    );

    return batchResult;
  }

  computeSaltedHash(data, salt) {
    const dataHash = typeof data === 'string' && data.startsWith('0x')
      ? data
      : hashLeaf(JSON.stringify(data));
    const saltBytes = typeof salt === 'string' && salt.startsWith('0x')
      ? salt
      : hashLeaf(String(salt));
    return computeSaltedLeaf(dataHash, saltBytes);
  }
}

module.exports = ProofService;
