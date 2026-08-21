const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChatMessage = sequelize.define('ChatMessage', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  sender: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['user', 'admin']]
    }
  },

  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

}, {
  tableName: 'chat_messages',
  timestamps: false,
});

module.exports = ChatMessage;