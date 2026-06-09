'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('VerificationLogs', {
      log_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      certificate_id: { type: Sequelize.INTEGER },
      verifier_wallet_address: { type: Sequelize.STRING(42) },
      verifier_ip: { type: Sequelize.STRING(45) },
      verification_status: {
        type: Sequelize.ENUM('valid', 'invalid', 'revoked', 'not_found'),
        allowNull: false
      },
      verification_timestamp: { type: Sequelize.DATE, allowNull: false },
      blockchain_verification: { type: Sequelize.BOOLEAN },
      error_message: { type: Sequelize.TEXT }
    });

    await queryInterface.addConstraint('VerificationLogs', {
      fields: ['certificate_id'],
      type: 'foreign key',
      name: 'verification_logs_certificate_fk',
      references: { table: 'Certificates', field: 'certificate_id' }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('VerificationLogs');
  }
};
