const { Model,DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class ShareOtp extends Model {}

ShareOtp.init(
  {
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shareotp: {
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
    modelName: 'ShareOtp',
    timestamps: false, // No need for timestamps unless you want them
  }
);

module.exports = ShareOtp;
