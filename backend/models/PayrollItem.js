
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PayrollItem = sequelize.define(
  "PayrollItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    teacherName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    accountName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    bankCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    transferReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    flutterwaveTransferId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "PROCESSING",
        "SUCCESSFUL",
        "FAILED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "etrend_payroll_items",
    timestamps: true,
    indexes: [
      {
        fields: ["batchId"],
      },
      {
        fields: ["teacherId"],
      },
    ],
  }
);

module.exports = PayrollItem;
