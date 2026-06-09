module.exports = {
  contracts_build_directory: "./artifacts",
  contracts_directory: './contracts',
  migrations_directory: './truffle-migrations',
  networks: {
    development: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
      gas: 50_000_000,
      gasPrice: 20_000_000_000
    },
    ganache: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 50_000_000,
      gasPrice: 20_000_000_000
    }
  },
  compilers: {
    solc: {
      version: '0.8.19',
      settings: {
        viaIR: true,
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
