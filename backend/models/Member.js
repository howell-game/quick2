const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db');  // Import Sequelize instance
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // For generating verification tokens


class Member extends Model {
  // Method to generate verification token
  generateVerificationToken() {
    const token = crypto.randomBytes(20).toString('hex');
    this.verificationToken = token;
    return token;
  }

  // Method to hash the password before saving
  static async hashPassword(member, options) {
    if (member.password && !member.password.startsWith('$2')) {
      const hashedPassword = await bcrypt.hash(member.password, 10);
      member.password = hashedPassword;
    }
  }
}

// Define the Sequelize model for Member
Member.init(
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shareBalance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    contributedShare: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sharePercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    memberId: {
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
    modelName: 'Member',
    hooks: {
      beforeSave: Member.hashPassword, // Before saving, hash the password if it's new or modified
    },
  }
);

module.exports = Member;
