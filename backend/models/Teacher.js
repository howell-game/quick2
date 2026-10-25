
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Teacher = sequelize.define(
  "Teacher",
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

    name: {
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

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "etrend_teachers",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "bankCode", "accountNumber"],
      },
    ],
  }
);

module.exports = Teacher;
