const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  ganacheUrl: process.env.GANACHE_URL,
  privateKey: process.env.PRIVATE_KEY,
  contractAddress: process.env.CONTRACT_ADDRESS
};