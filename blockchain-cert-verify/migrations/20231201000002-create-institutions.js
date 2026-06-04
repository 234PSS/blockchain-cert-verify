'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Institutions', {
      institution_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      address: { type: Sequelize.TEXT },
      contact_email: { type: Sequelize.STRING(100) },
      wallet_address: { type: Sequelize.STRING(42), unique: true },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      verification_date: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Institutions');
  }
};