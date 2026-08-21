const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual Sequelize instance

class UnresolvedIssue extends Model {}

UnresolvedIssue.init(
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if not mandatory
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if not mandatory
    },
    aiResponse: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null if not mandatory
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Default is false if not specified
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Default to current timestamp if not provided
    },
  },
  {
    sequelize, // Your Sequelize instance
    modelName: 'UnresolvedIssue',
    timestamps: false, // Disable timestamps if you're manually controlling timestamps
  }
);

module.exports = UnresolvedIssue;
