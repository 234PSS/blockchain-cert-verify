'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('BlockchainTransactions', {
      tx_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      transaction_hash: { type: Sequelize.STRING(66), unique: true, allowNull: false },
      contract_address: { type: Sequelize.STRING(42), allowNull: false },
      function_name: { type: Sequelize.STRING(100), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending'
      },
      gas_used: { type: Sequelize.BIGINT },
      gas_price: { type: Sequelize.BIGINT },
      block_number: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      completed_at: { type: Sequelize.DATE }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('BlockchainTransactions');
  }
};
