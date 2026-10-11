
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
      allowNull: false
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 40
    },

    teacherActivities: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },

    studentActivities: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },

    lessonContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },

    speedWork: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },

    conclusion: {
      type: DataTypes.TEXT,
      allowNull: false,
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
