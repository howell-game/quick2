const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class ShareWithdrawal extends Model {}

ShareWithdrawal.init(
  {
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
    },
    account_bank: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
    },
    amount: {
      type: DataTypes.FLOAT,  // For storing decimal values
      allowNull: false,  // Ensures the field is required
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
      unique: true,  // Ensures each reference is unique
    },
    status: {
      type: DataTypes.ENUM('pending', 'successful', 'failed'), // Enum values for status
      defaultValue: 'pending',  // Default status is 'pending'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Default to the current date and time
    },
    transactionType: {
      type: DataTypes.STRING,  // Assuming this is a string field
    },
  },
  {
    sequelize,
    modelName: 'ShareWithdrawal',
    timestamps: false,  // Disables automatic createdAt/updatedAt columns
  }
);

module.exports = ShareWithdrawal;
