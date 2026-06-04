module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const Institution = sequelize.define('Institution', {
    institution_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT
    },
    contact_email: {
      type: DataTypes.STRING(100)
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      unique: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_date: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Institution.associate = (models) => {
    Institution.hasMany(models.Course, { foreignKey: 'institution_id' });
    Institution.hasMany(models.Certificate, { foreignKey: 'institution_id' });
  };

  return Institution;
};