const { ethers } = require('ethers');
const dotenv = require('dotenv');
const AppError = require('../utils/AppError');

dotenv.config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.unavailableReason = 'Blockchain service not initialized';
  }

  async initialize(contractAddress, abi) {
    if (!process.env.GANACHE_URL) {
      this._setUnavailable('GANACHE_URL is not configured');
      throw new AppError(this.unavailableReason, 503);
    }

    if (!process.env.PRIVATE_KEY) {
      this._setUnavailable('PRIVATE_KEY is not configured');
      throw new AppError(this.unavailableReason, 503);
    }

    if (!contractAddress || !abi) {
      this._setUnavailable('Contract address or ABI is not available');
      throw new AppError(this.unavailableReason, 503);
    }

    try {
      this.provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
      await this.provider.getNetwork();

      const privateKey = process.env.PRIVATE_KEY.startsWith('0x')
        ? process.env.PRIVATE_KEY
        : `0x${process.env.PRIVATE_KEY}`;

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, abi, this.wallet);

      const code = await this.provider.getCode(contractAddress);
      if (code === '0x') {
        this._setUnavailable(`No contract deployed at ${contractAddress}`);
        throw new AppError(this.unavailableReason, 503);
      }

      this.unavailableReason = null;
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      this._setUnavailable(`Failed to connect to blockchain: ${error.message}`);
      throw new AppError(this.unavailableReason, 503);
    }
  }

  _setUnavailable(reason) {
    this.unavailableReason = reason;
    this.contract = null;
  }

  isReady() {
    return this.contract !== null && !this.unavailableReason;
  }

  getStatus() {
    return {
      ready: this.isReady(),
      reason: this.isReady() ? null : this.unavailableReason,
      contractAddress: this.contract?.target || null,
      walletAddress: this.wallet?.address || null
    };
  }

  getUnavailableReason() {
    return this.unavailableReason;
  }

  markUnavailable(reason) {
    this._setUnavailable(reason);
  }

  _ensureReady() {
    if (!this.isReady()) {
      throw new AppError(
        this.unavailableReason || 'Blockchain service is not available',
        503
      );
    }
  }

  async _execute(action, fn) {
    this._ensureReady();
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AppError) throw error;
      const revertReason = error.revert?.args?.[0] || error.reason;
      const message = revertReason || error.shortMessage || error.message;
      throw new AppError(`Blockchain ${action} failed: ${message}`, 502);
    }
  }

  computeCertificateId(studentId, courseId, graduationDate) {
    const timestamp = Math.floor(new Date(graduationDate).getTime() / 1000);
    return ethers.keccak256(
      ethers.solidityPacked(['string', 'string', 'uint256'], [studentId, courseId, timestamp])
    );
  }

  parseCertificateIdFromReceipt(receipt) {
    if (!receipt?.logs || !this.contract) return null;

    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        if (parsed?.name === 'CertificateIssued') {
          return parsed.args.certificateId;
        }
      } catch {
        // not a CertificateIssued event
      }
    }

    return null;
  }

  // ========== SINGLE CERTIFICATE OPERATIONS ==========

  async issueCertificate(certificateData) {
    return this._execute('issue', async () => {
      const certificateId = this.computeCertificateId(
        certificateData.studentId,
        certificateData.courseId,
        certificateData.graduationDate
      );

      const certificateHash = ethers.keccak256(
        ethers.toUtf8Bytes(certificateData.certificateHash)
      );

      const tx = await this.contract.issueCertificate(certificateId, certificateHash);
      const receipt = await tx.wait();

      return { receipt, certificateId, hash: receipt.hash };
    });
  }

  async verifyCertificate(certificateId) {
    return this._execute('verify', async () => {
      const id = this._normalizeBytes32(certificateId);
      const [valid, certificateHash, issuer, issuedAt, revoked] =
        await this.contract.verifyCertificate(id);
      return {
        valid,
        certificateHash,
        issuer,
        issuedAt: Number(issuedAt),
        revoked
      };
    });
  }

  async revokeCertificate(certificateId) {
    return this._execute('revoke', async () => {
      const id = this._normalizeBytes32(certificateId);
      const tx = await this.contract.revokeCertificate(id);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash };
    });
  }

  async getCertificate(certificateId) {
    return this._execute('getCertificate', async () => {
      const id = this._normalizeBytes32(certificateId);
      const cert = await this.contract.getCertificate(id);
      return {
        certificateHash: cert.certificateHash,
        issuer: cert.issuer,
        issuedAt: Number(cert.issuedAt),
        revoked: cert.revoked
      };
    });
  }

  // ========== BATCH OPERATIONS ==========

  async issueCertificatesBatch(certificatesArray) {
    return this._execute('batchIssue', async () => {
      const ids = [];
      const hashes = [];

      for (const cert of certificatesArray) {
        const certificateId = this.computeCertificateId(
          cert.studentId,
          cert.courseId,
          cert.graduationDate
        );
        const certificateHash = ethers.keccak256(
          ethers.toUtf8Bytes(cert.certificateHash)
        );
        ids.push(certificateId);
        hashes.push(certificateHash);
      }

      const tx = await this.contract.issueCertificatesBatch(ids, hashes);
      const receipt = await tx.wait();

      return {
        receipt,
        hash: receipt.hash,
        certificateIds: ids,
        count: ids.length
      };
    });
  }

  async revokeCertificatesBatch(certificateIds) {
    return this._execute('batchRevoke', async () => {
      const normalized = certificateIds.map(id => this._normalizeBytes32(id));
      const tx = await this.contract.revokeCertificatesBatch(normalized);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash, count: normalized.length };
    });
  }

  // ========== MERKLE TREE OPERATIONS ==========

  async updateMerkleRoot(merkleRoot) {
    return this._execute('updateMerkleRoot', async () => {
      const root = ethers.zeroPadValue(ethers.getBytes(merkleRoot), 32);
      const tx = await this.contract.updateMerkleRoot(root);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash, merkleRoot: root };
    });
  }

  async verifyByMerkleProof(leaf, proof, issuerAddress) {
    return this._execute('merkleVerify', async () => {
      const leafBytes = ethers.zeroPadValue(ethers.getBytes(leaf), 32);
      const proofBytes = proof.map(p => ethers.zeroPadValue(ethers.getBytes(p), 32));
      return this.contract.verifyByMerkleProof(leafBytes, proofBytes, issuerAddress);
    });
  }

  async getIssuerMerkleRoot(issuerAddress) {
    return this._execute('getMerkleRoot', async () => {
      const [root, timestamp] = await this.contract.getIssuerMerkleRoot(issuerAddress);
      return { root, timestamp: Number(timestamp) };
    });
  }

  // ========== MULTI-TENANT: ISSUER MANAGEMENT ==========

  async registerIssuer(name, domain) {
    return this._execute('registerIssuer', async () => {
      const tx = await this.contract.registerIssuer(name, domain);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash };
    });
  }

  async updateIssuerStatus(walletAddress, active) {
    return this._execute('updateIssuerStatus', async () => {
      const tx = await this.contract.updateIssuerStatus(walletAddress, active);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash, walletAddress, active };
    });
  }

  async isIssuer(walletAddress) {
    return this._execute('isIssuer', async () => {
      return this.contract.isIssuer(walletAddress);
    });
  }

  async getIssuer(walletAddress) {
    return this._execute('getIssuer', async () => {
      const issuer = await this.contract.getIssuer(walletAddress);
      return {
        name: issuer.name,
        domain: issuer.domain,
        active: issuer.active,
        registeredAt: Number(issuer.registeredAt)
      };
    });
  }

  async getAllIssuers() {
    return this._execute('getAllIssuers', async () => {
      const [addresses, issuers] = await this.contract.getAllIssuers();
      return addresses.map((addr, i) => ({
        wallet: addr,
        name: issuers[i].name,
        domain: issuers[i].domain,
        active: issuers[i].active,
        registeredAt: Number(issuers[i].registeredAt)
      }));
    });
  }

  // ========== CIRCUIT BREAKER ==========

  async pause() {
    return this._execute('pause', async () => {
      const tx = await this.contract.pause();
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash };
    });
  }

  async unpause() {
    return this._execute('unpause', async () => {
      const tx = await this.contract.unpause();
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash };
    });
  }

  async isPaused() {
    return this._execute('paused', async () => {
      return this.contract.paused();
    });
  }

  // ========== UTILITY ==========

  _normalizeBytes32(value) {
    if (!value) {
      throw new AppError('Blockchain certificate ID is required', 400);
    }
    return ethers.zeroPadValue(ethers.getBytes(value), 32);
  }

  getContractAddress() {
    return this.contract?.target || null;
  }
}

module.exports = new BlockchainService();
