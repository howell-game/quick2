const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Your Sequelize instance

const CumulativeData = sequelize.define('CumulativeData', {
  totalInvestmentAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  cumulativeLeftoverFunds: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  sumOfWinningROIs: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  }
}, {
  tableName: 'cumulative_data',
  timestamps: true, // This adds createdAt and updatedAt automatically
});

module.exports = CumulativeData;
