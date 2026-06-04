module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const Certificate = sequelize.define('Certificate', {
    certificate_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    certificate_hash: {
      type: DataTypes.STRING(66),
      allowNull: false
    },
    blockchain_tx_hash: {
      type: DataTypes.STRING(66),
      unique: true
    },
    blockchain_certificate_id: {
      type: DataTypes.STRING(66)
    },
    grade: {
      type: DataTypes.STRING(10)
    },
    remarks: {
      type: DataTypes.TEXT
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    revoked_at: {
      type: DataTypes.DATE
    },
    revoked_reason: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Student, { foreignKey: 'student_id' });
    Certificate.belongsTo(models.Course, { foreignKey: 'course_id' });
    Certificate.belongsTo(models.Institution, { foreignKey: 'institution_id' });
    Certificate.hasMany(models.VerificationLog, { foreignKey: 'certificate_id' });
  };

  return Certificate;
};