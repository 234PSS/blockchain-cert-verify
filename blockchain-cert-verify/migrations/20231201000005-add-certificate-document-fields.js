'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Certificates', 'document_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('Certificates', 'document_original_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('Certificates', 'document_mime_type', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('Certificates', 'document_hash', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.addColumn('Certificates', 'qr_code_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Certificates', 'document_path');
    await queryInterface.removeColumn('Certificates', 'document_original_name');
    await queryInterface.removeColumn('Certificates', 'document_mime_type');
    await queryInterface.removeColumn('Certificates', 'document_hash');
    await queryInterface.removeColumn('Certificates', 'qr_code_path');
  }
};
