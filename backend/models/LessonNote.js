
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const LessonNote = sequelize.define(
  "LessonNote",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    academicSession: {
      type: DataTypes.STRING(20),
      allowNull: false
    },

    term: {
      type: DataTypes.ENUM(
        "First Term",
        "Second Term",
        "Third Term"
      ),
      allowNull: false
    },

    className: {
      type: DataTypes.STRING(30),
      allowNull: false
    },

    subject: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    weekNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 60,
        isInt: true
      }
    },

    topic: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    objectives: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },

    materials: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },

    previousKnowledge: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },

    content: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },

    activities: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },

    evaluation: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },

    assignment: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    }
  },
  {
    tableName: "lesson_notes",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: [
          "academicSession",
          "term",
          "className",
          "subject",
          "weekNumber"
        ],
        name: "lesson_notes_unique_week"
      }
    ]
  }
);

module.exports = LessonNote;
