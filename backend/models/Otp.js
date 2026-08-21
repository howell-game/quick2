const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class Otp extends Model {}

Otp.init(
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Otp',
    timestamps: false, // No timestamps unless you need createdAt/updatedAt
  }
);

module.exports = Otp;
