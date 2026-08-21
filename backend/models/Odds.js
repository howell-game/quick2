const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class Odds extends Model {}

Odds.init(
  {
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    supplyOdds: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    demandOdds: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Odds',
    timestamps: false, // This prevents Sequelize from automatically adding createdAt and updatedAt fields
  }
);

module.exports = Odds;
