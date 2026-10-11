
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SchemeOfWorkWeek = sequelize.define(
  "SchemeOfWorkWeek",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    schemeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "schemes_of_work",
        key: "id"
      },
      onDelete: "CASCADE"
    },

    week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 60,
        isInt: true
      }
    },

    topic: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    objectives: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    activities: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    evaluation: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    tableName: "scheme_of_work_weeks",
    timestamps: true,
    indexes: [
      {
        name: "unique_week_per_scheme",
        unique: true,
        fields: ["schemeId", "week"]
      }
    ]
  }
);

module.exports = SchemeOfWorkWeek;
