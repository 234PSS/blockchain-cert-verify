module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const VerificationLog = sequelize.define('VerificationLog', {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    certificate_id: {
      type: DataTypes.UUID
    },
    verifier_wallet_address: {
      type: DataTypes.STRING(42)
    },
    verifier_ip: {
      type: DataTypes.STRING(45)
    },
    verification_status: {
      type: DataTypes.ENUM('valid', 'invalid', 'revoked', 'not_found'),
      allowNull: false
    },
    blockchain_verification: {
      type: DataTypes.BOOLEAN
    },
    error_message: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: false,
    createdAt: 'verification_timestamp'
  });

  VerificationLog.associate = (models) => {
    VerificationLog.belongsTo(models.Certificate, { foreignKey: 'certificate_id' });
  };

  return VerificationLog;
};