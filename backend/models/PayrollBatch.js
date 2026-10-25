
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PayrollBatch = sequelize.define(
  "PayrollBatch",
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

    idempotencyKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    serviceFee: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },

    teacherCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "PROCESSING",
        "COMPLETED",
        "PARTIAL",
        "FAILED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },
  },
  {
    tableName: "etrend_payroll_batches",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "idempotencyKey"],
      },
    ],
  }
);

module.exports = PayrollBatch;
