module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const BlockchainTransaction = sequelize.define('BlockchainTransaction', {
    tx_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_hash: {
      type: DataTypes.STRING(66),
      unique: true,
      allowNull: false
    },
    contract_address: {
      type: DataTypes.STRING(42),
      allowNull: false
    },
    function_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending'
    },
    gas_used: {
      type: DataTypes.BIGINT
    },
    gas_price: {
      type: DataTypes.BIGINT
    },
    block_number: {
      type: DataTypes.INTEGER
    },
    completed_at: {
      type: DataTypes.DATE
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return BlockchainTransaction;
};