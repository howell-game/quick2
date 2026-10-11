
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SchemeOfWork = sequelize.define(
  "SchemeOfWork",
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
    }
  },
  {
    tableName: "schemes_of_work",
    timestamps: true,
    indexes: [
      {
        name: "unique_scheme_per_session_term_class_subject",
        unique: true,
        fields: [
          "academicSession",
          "term",
          "className",
          "subject"
        ]
      }
    ]
  }
);

module.exports = SchemeOfWork;
