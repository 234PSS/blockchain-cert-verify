const dotenv = require('dotenv');
const { loadContractConfig } = require('./loadContract');

dotenv.config();

const { address, abi, deployment } = loadContractConfig();

module.exports = {
  ganacheUrl: process.env.GANACHE_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: address,
  contractAbi: abi,
  deployment
};
