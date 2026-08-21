const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class SharePlatformFee extends Model {}

SharePlatformFee.init(
  {
    type: {
      type: DataTypes.STRING,
      defaultValue: 'main',
      allowNull: false,
    },
    totalFees: {
      type: DataTypes.FLOAT,  // For storing decimal values, use FLOAT or DECIMAL
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'SharePlatformFee',
    timestamps: false,  // No need for automatic timestamps unless required
  }
);

module.exports = SharePlatformFee;
