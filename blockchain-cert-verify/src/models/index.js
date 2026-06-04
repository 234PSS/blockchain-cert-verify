const sequelize = require('../config/database');
const User = require('./User');
const Certificate = require('./Certificate');
const Institution = require('./Institution');
const Student = require('./Student');
const Course = require('./Course');
const VerificationLog = require('./VerificationLog');
const BlockchainTransaction = require('./BlockchainTransaction');

const models = {
  User: User(sequelize),
  Certificate: Certificate(sequelize),
  Institution: Institution(sequelize),
  Student: Student(sequelize),
  Course: Course(sequelize),
  VerificationLog: VerificationLog(sequelize),
  BlockchainTransaction: BlockchainTransaction(sequelize)
};

Object.keys(models).forEach(key => {
  if (typeof models[key].associate === 'function') {
    models[key].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
};