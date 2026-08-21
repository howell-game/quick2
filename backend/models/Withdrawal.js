const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

const Withdrawal = sequelize.define('Withdrawal', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account_bank: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'successful', 'failed'),
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  transactionType: {
    type: DataTypes.STRING,
  }
}, {
  tableName: 'withdrawals',
  timestamps: false,
});

module.exports = Withdrawal;
