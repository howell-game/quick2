const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Your Sequelize instance

const Deposit = sequelize.define('Deposit', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'successful', 'failed'),
    defaultValue: 'pending',
  },
  flutterwaveReference: {
    type: DataTypes.STRING,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  transactionType: {
    type: DataTypes.STRING,
  }
}, {
  tableName: 'deposits',
  timestamps: false, // You already have createdAt manually
});

module.exports = Deposit;
