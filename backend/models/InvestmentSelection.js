const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Replace with your Sequelize instance

const InvestmentSelection = sequelize.define('InvestmentSelection', {
  investmentCode: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  timeframe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  selectedInvestments: {
    type: DataTypes.JSONB, // Stores the array of selected investments with category, choice, odds, outcome
    allowNull: false,
  },
  synchronized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  distributed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
   outcome: {
    type: DataTypes.ENUM('active', 'completed'),
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('awaiting', 'active', 'completed'),
    defaultValue: 'awaiting',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'investment_selections',
  timestamps: false,
});

module.exports = InvestmentSelection;
