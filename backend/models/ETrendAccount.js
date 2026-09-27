const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendAccount = sequelize.define(
  "ETrendAccount",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    flutterwaveWalletId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    flutterwaveAccountReference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    flutterwaveBarterId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bankCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    accountName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "NGN",
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "etrend_accounts",
    timestamps: true,
  }
);

module.exports = ETrendAccount;