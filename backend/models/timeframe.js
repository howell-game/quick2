const { Model,DataTypes } = require('sequelize');
const sequelize = require('../db');

class Timeframe extends Model {}

Timeframe.init(
  {
    name: {
      type: DataTypes.ENUM('5m', '15m', '30m', '1h', '4h', '1d'),
      allowNull: false,  // Ensures the field is required
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,  // Ensures the field is required
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,  // Ensures the field is required
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',  // Default status is 'active'
    },
  },
  {
    sequelize,
    modelName: 'Timeframe',
    timestamps: false,  // Disables automatic createdAt/updatedAt columns
  }
);

module.exports = Timeframe;
