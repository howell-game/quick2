const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendElectricityTransaction = sequelize.define(
  "ETrendElectricityTransaction",
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

    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },

    serviceID: {
      type: DataTypes.STRING,
      allowNull: false
    },

    meterNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },

    meterType: {
      type: DataTypes.STRING,
      allowNull: false
    },

    customerName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    customerAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },

    customerAccountType: {
      type: DataTypes.STRING,
      allowNull: true
    },

    serviceBand: {
      type: DataTypes.STRING,
      allowNull: true
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    providerAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },

    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },

    token: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    units: {
      type: DataTypes.STRING,
      allowNull: true
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING"
    },

    requestId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    providerResponse: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    flutterwaveTransferId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    flutterwaveTransferReference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },

    flutterwaveTransferStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "etrend_electricity_transactions",
    timestamps: true
  }
);

module.exports = ETrendElectricityTransaction;