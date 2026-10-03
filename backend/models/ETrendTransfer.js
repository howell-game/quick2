const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendTransfer = sequelize.define(
  "ETrendTransfer",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },

    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    flutterwaveTransferId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    flutterwaveFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },

    etrendFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NEW"
    },

    feeStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING"
    },

    feeTransferId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    feeTransferReference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    feeTransferStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "etrend_transfers",
    timestamps: true
  }
);

module.exports = ETrendTransfer;