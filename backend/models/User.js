const {Model, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust with your actual Sequelize instance
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Required for generating verification tokens

class User extends Model {
  // Custom method to generate verification token
  generateVerificationToken() {
    const token = crypto.randomBytes(20).toString('hex');
    this.verificationToken = token;
    return token;
  }

  // Hook to hash password before saving
  static async hashPassword(user) {
    if (user.password && !user.password.startsWith('$2')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
}

// Initialize the User model
User.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mode: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // true = Real, false = Demo
      },
    referralCode: {
      type: DataTypes.STRING,
      unique: true,
    },
    referredBy: {
      type: DataTypes.STRING, // The referralCode of the person who referred them
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    demoBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationToken: {
      type: DataTypes.STRING,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
    },
    failedAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    blockUntil: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeSave: User.hashPassword, // Call hashPassword before saving the user
    },
  }
);

module.exports = User;
