const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Replace with your Sequelize instance

const Investment = sequelize.define('Investment', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  choice: {
    type: DataTypes.ENUM('Demand', 'Supply'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('awaiting', 'active', 'completed'),
    defaultValue: 'awaiting',
  },
  odds: {
    type: DataTypes.FLOAT,
    defaultValue: null,
  },
  timeframe: {
    type: DataTypes.ENUM('5m', '15m', '30m', '1h', '4h', '1d'),
    allowNull: false,
  },
  outcome: {
    type: DataTypes.ENUM('win', 'loss', 'neutral'),
    defaultValue: null,
  },
  distributed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  roi: {
  type: DataTypes.FLOAT,
  allowNull: false,
  defaultValue: 0,
},
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isProcessing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  synchronized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'investments',
  timestamps: false, // Because we manually define createdAt
});

module.exports = Investment;
