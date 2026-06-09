module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const ApiKey = sequelize.define('ApiKey', {
    key_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false
    },
    key_name: {
      type: DataTypes.STRING(100)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expires_at: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return ApiKey;
};
