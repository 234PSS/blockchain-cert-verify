const { ethers } = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contract = null;
  }

  async initialize(contractAddress, abi) {
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
  }

  async issueCertificate(certificateData) {
    const tx = await this.contract.issueCertificate(
      certificateData.studentName,
      certificateData.studentId,
      certificateData.courseName,
      certificateData.courseId,
      certificateData.institution,
      Math.floor(new Date(certificateData.graduationDate).getTime() / 1000),
      certificateData.certificateHash
    );
    return await tx.wait();
  }

  async verifyCertificate(certificateId) {
    return await this.contract.verifyCertificate(certificateId);
  }

  async revokeCertificate(certificateId) {
    const tx = await this.contract.revokeCertificate(certificateId);
    return await tx.wait();
  }

  async getContractAddress() {
    return this.contract?.target;
  }
}

module.exports = new BlockchainService();