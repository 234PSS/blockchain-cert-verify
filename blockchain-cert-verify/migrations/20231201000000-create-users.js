'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      user_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'university_staff', 'student'), defaultValue: 'student' },
      wallet_address: { type: Sequelize.STRING(42), unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};