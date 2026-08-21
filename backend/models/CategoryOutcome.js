const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Ensure this points to your Sequelize instance

const CategoryOutcome = sequelize.define('CategoryOutcome', {
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  outcome: {
    type: DataTypes.ENUM('Supply', 'Demand'),
    allowNull: false,
  },
  maxEROI: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  meanROI: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'category_outcomes',
  timestamps: false,
});

module.exports = CategoryOutcome;
