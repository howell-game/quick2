const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Categories = sequelize.define(
  "Categories",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },

    categories: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "categories",
    timestamps: false,
  }
);

module.exports = Categories;