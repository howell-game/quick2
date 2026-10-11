
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const LessonNotePeriod = sequelize.define(
  "LessonNotePeriod",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    lessonNoteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "lesson_notes",
        key: "id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },

    periodNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
        isInt: true
      }
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ""
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 40,
      validate: {
        min: 1,
        max: 300,
        isInt: true
      }
    },

    teacherActivities: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    },

    studentActivities: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    },

    lessonContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    },

    speedWork: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },

    conclusion: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    }
  },
  {
    tableName: "lesson_note_periods",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["lessonNoteId", "periodNumber"],
        name: "lesson_note_period_unique"
      }
    ]
  }
);

module.exports = LessonNotePeriod;
