
const { DataTypes } = require("sequelize");
const sequelize = require('../db');

const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    className: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "class_name",
    },

    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    topic: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    questionType: {
      type: DataTypes.ENUM("objective", "theory"),
      allowNull: false,
      defaultValue: "objective",
      field: "question_type",
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    options: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },

    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "questions",
    timestamps: true,
    indexes: [
      {
        fields: ["class_name", "subject"],
      },
    ],
  }
);

module.exports = Question;
