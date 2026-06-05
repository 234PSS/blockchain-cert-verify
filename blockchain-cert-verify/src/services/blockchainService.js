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

  async issueCertificate(certificateData) {
    return this._execute('issue', async () => {
      const graduationTimestamp = Math.floor(
        new Date(certificateData.graduationDate).getTime() / 1000
      );

      const tx = await this.contract.issueCertificate(
        certificateData.studentName,
        certificateData.studentId,
        certificateData.courseName,
        certificateData.courseId,
        certificateData.institution,
        graduationTimestamp,
        certificateData.certificateHash
      );

      const receipt = await tx.wait();
      const certificateId = this.parseCertificateIdFromReceipt(receipt)
        || this.computeCertificateId(
          certificateData.studentId,
          certificateData.courseId,
          certificateData.graduationDate
        );

      return { receipt, certificateId, hash: receipt.hash };
    });
  }

  async verifyCertificate(certificateId) {
    return this._execute('verify', async () => {
      const id = this._normalizeBytes32(certificateId);
      const [valid, certificateHash, institution] = await this.contract.verifyCertificate(id);
      return { valid, certificateHash, institution };
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
        studentName: cert.studentName,
        studentId: cert.studentId,
        courseName: cert.courseName,
        courseId: cert.courseId,
        institution: cert.institution,
        graduationDate: Number(cert.graduationDate),
        certificateHash: cert.certificateHash,
        exists: cert.exists
      };
    });
  }

  async authorizeUniversity(universityAddress, authorized = true) {
    return this._execute('authorizeUniversity', async () => {
      const tx = await this.contract.authorizeUniversity(universityAddress, authorized);
      const receipt = await tx.wait();
      return { receipt, hash: receipt.hash, universityAddress, authorized };
    });
  }

  async isUniversityAuthorized(universityAddress) {
    return this._execute('authorization check', async () => {
      return this.contract.isAuthorized(universityAddress);
    });
  }

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
