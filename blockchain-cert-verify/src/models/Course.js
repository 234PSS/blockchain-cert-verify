module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const Course = sequelize.define('Course', {
    course_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    course_code: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    course_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    credits: {
      type: DataTypes.INTEGER
    },
    institution_id: {
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  Course.associate = (models) => {
    Course.belongsTo(models.Institution, { foreignKey: 'institution_id' });
    Course.hasMany(models.Certificate, { foreignKey: 'course_id' });
  };

  return Course;
};