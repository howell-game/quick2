const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // make sure this points to your Sequelize instance

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  odds_demand: {
    type: DataTypes.FLOAT,
    defaultValue: 50,
  },
  odds_supply: {
    type: DataTypes.FLOAT,
    defaultValue: 50,
  }
}, {
  tableName: 'categories',
  timestamps: false,
});

module.exports = Category;
