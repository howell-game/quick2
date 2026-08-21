const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual sequelize instance

class ShareTransaction extends Model {}

ShareTransaction.init(
  {
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
    },
    amount: {
      type: DataTypes.FLOAT,  // For storing decimal values
      allowNull: false,  // Ensures the field is required
    },
    status: {
      type: DataTypes.ENUM('pending', 'successful', 'failed'), // Enum values for status
      defaultValue: 'pending',  // Default status is 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,  // Ensures the field is required
      unique: true,  // Ensures each transactionId is unique
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
    modelName: 'ShareTransaction',
    timestamps: false,  // Disables automatic createdAt/updatedAt columns
  }
);

module.exports = ShareTransaction;
