'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Students', {
      student_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, unique: true },
      student_number: { type: Sequelize.STRING(50), unique: true, allowNull: false },
      enrollment_date: { type: Sequelize.DATEONLY, allowNull: false },
      graduation_date: { type: Sequelize.DATEONLY },
      department: { type: Sequelize.STRING(100) },
      degree_program: { type: Sequelize.STRING(100) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Students');
  }
};