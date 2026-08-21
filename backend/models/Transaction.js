const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Transaction extends Model {}

Transaction.init(
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    bankCode: {
    type: DataTypes.STRING,
    allowNull: true,
},

bankName: {
    type: DataTypes.STRING,
    allowNull: true,
},

accountName: {
    type: DataTypes.STRING,
    allowNull: true,
},

accountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
},

maskedAccountNumber: {
    type: DataTypes.STRING,
    allowNull: true,
},

metadata: {
    type: DataTypes.JSON,
    allowNull: true,
},

    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },

    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    reference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },

    transactionType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "deposit",
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "successful",
        "failed",
        "cancelled",
        "processing"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "NGN",
    },

    flutterwaveId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    paymentType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    processorResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    gatewayResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "Transactions",
    timestamps: true,
  }
);

module.exports = Transaction;