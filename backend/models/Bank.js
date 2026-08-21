const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db");

class Bank extends Model {}

Bank.init(
  {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING,
      defaultValue: "NG",
    },

    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Bank",
    tableName: "Banks",
    timestamps: true,
  }
);

module.exports = Bank;