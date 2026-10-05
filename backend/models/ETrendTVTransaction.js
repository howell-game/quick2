const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendTVTransaction = sequelize.define(
  "ETrendTVTransaction",
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

    smartcardNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },

    customerName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    currentBouquet: {
      type: DataTypes.STRING,
      allowNull: true
    },

    variationCode: {
      type: DataTypes.STRING,
      allowNull: true
    },

    packageName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    subscriptionType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "change"
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    providerAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },

    renewalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },

    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
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
    tableName: "etrend_tv_transactions",
    timestamps: true
  }
);

module.exports = ETrendTVTransaction;