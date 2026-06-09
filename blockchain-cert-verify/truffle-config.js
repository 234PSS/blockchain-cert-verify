module.exports = {
  contracts_build_directory: "./artifacts",
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      dialect: "mysql",
      seederStorage: "sequelize",
      migrationStorage: "sequelize"
    },
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"
      }
    }
  },
  db: {
    host: "localhost",
    user: "root",
    password: "password",
    database: "certificate_db"
  }
};