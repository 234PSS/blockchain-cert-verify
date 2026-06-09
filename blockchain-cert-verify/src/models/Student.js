module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const Student = sequelize.define('Student', {
    student_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      unique: true
    },
    student_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    enrollment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    graduation_date: {
      type: DataTypes.DATEONLY
    },
    department: {
      type: DataTypes.STRING(100)
    },
    degree_program: {
      type: DataTypes.STRING(100)
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Student.associate = (models) => {
    Student.belongsTo(models.User, { foreignKey: 'user_id' });
    Student.hasMany(models.Certificate, { foreignKey: 'student_id' });
  };

  return Student;
};