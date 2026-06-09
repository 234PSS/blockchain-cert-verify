module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'university_staff', 'student'),
      defaultValue: 'student'
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      unique: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.hasOne(models.Student, { foreignKey: 'user_id' });
    User.hasMany(models.ApiKey, { foreignKey: 'user_id' });
  };

  return User;
};