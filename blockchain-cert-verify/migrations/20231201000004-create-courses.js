'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Courses', {
      course_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      course_code: { type: Sequelize.STRING(20), unique: true, allowNull: false },
      course_name: { type: Sequelize.STRING(100), allowNull: false },
      credits: { type: Sequelize.INTEGER },
      institution_id: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });
    
    await queryInterface.addConstraint('Courses', {
      fields: ['institution_id'],
      type: 'foreign key',
      name: 'courses_institution_fk',
      references: { table: 'Institutions', field: 'institution_id' }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Courses');
  }
};