const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ETrendAirtimeTransaction = sequelize.define(
  "ETrendAirtimeTransaction",
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

    network: {
      type: DataTypes.STRING,
      allowNull: false
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
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

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "PENDING"
    },

    providerTransactionId: {
      type: DataTypes.STRING,
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

    providerResponse: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "etrend_airtime_transactions",
    timestamps: true
  }
);

module.exports = ETrendAirtimeTransaction;