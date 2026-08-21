const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Replace with your actual Sequelize instance

const GroupedInvestment = sequelize.define('GroupedInvestment', {
  groupCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  timeframe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  investmentAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  adjustedNetInvestment: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  share: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalNetInvestment: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'grouped_investments',
  timestamps: false, // We manually manage createdAt
});

module.exports = GroupedInvestment;
