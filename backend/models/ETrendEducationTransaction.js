const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendEducationTransaction = sequelize.define(
  "ETrendEducationTransaction",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    examType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    serviceID: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    variationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    packageName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    profileId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    customerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    providerAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
    },

    pin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING",
    },

    requestId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    providerTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    providerResponse: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    flutterwaveTransferId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    flutterwaveTransferReference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    flutterwaveTransferStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "etrend_education_transactions",
    timestamps: true,
  }
);

module.exports = ETrendEducationTransaction;