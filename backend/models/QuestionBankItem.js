const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const QuestionBankItem = sequelize.define(
    "QuestionBankItemV2",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },

        batchId: {
            type: DataTypes.UUID,
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

        topic: {
            type: DataTypes.STRING(200),
            allowNull: false
        },

        questionType: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: [["objective", "theory"]]
            }
        },

        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        options: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: []
        },

        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },

        imageUrl: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        imagePublicId: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    },
    {
        tableName: "question_bank_items_v2",
        timestamps: true,
        freezeTableName: true
    }
);

module.exports = QuestionBankItem;