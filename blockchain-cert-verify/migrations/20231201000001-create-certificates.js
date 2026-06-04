'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Certificates', {
      certificate_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: { type: Sequelize.INTEGER, allowNull: false },
      course_id: { type: Sequelize.INTEGER, allowNull: false },
      institution_id: { type: Sequelize.INTEGER, allowNull: false },
      certificate_hash: { type: Sequelize.STRING(66), allowNull: false },
      blockchain_tx_hash: { type: Sequelize.STRING(66), unique: true },
      blockchain_certificate_id: { type: Sequelize.STRING(66) },
      grade: { type: Sequelize.STRING(10) },
      remarks: { type: Sequelize.TEXT },
      is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      revoked_at: { type: Sequelize.DATE },
      revoked_reason: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    
    await queryInterface.addConstraint('Certificates', {
      fields: ['student_id'],
      type: 'foreign key',
      name: 'certificates_student_fk',
      references: { table: 'Students', field: 'student_id' }
    });
    
    await queryInterface.addConstraint('Certificates', {
      fields: ['course_id'],
      type: 'foreign key',
      name: 'certificates_course_fk',
      references: { table: 'Courses', field: 'course_id' }
    });
    
    await queryInterface.addConstraint('Certificates', {
      fields: ['institution_id'],
      type: 'foreign key',
      name: 'certificates_institution_fk',
      references: { table: 'Institutions', field: 'institution_id' }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Certificates');
  }
};