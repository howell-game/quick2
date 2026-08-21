const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class PlatformFee extends Model {}

PlatformFee.init(
  {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'main', // Default value for 'type'
      
    },
    totalFees: {
      type: DataTypes.INTEGER, // Using INTEGER for the total fees
      allowNull: false,
      defaultValue: 0, // Default value for totalFees
    },
  },
  {
    sequelize,
    modelName: 'PlatformFee',
    timestamps: false, // No need for timestamps unless you want them
  }
);

module.exports = PlatformFee;
