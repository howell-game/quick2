const express = require('express');
const User = require("../models/User");
const Member = require("../models/Member");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require("crypto");
const { sendVerificationEmail } = require('../utils/email');
const { sendPasswordResetEmail } = require('../utils/email');
require('dotenv').config();

const router = express.Router();

async function handleReferralTracking(referralCode, newUserId) {
  if (!referralCode) return;

  try {
    const referrer = await User.findOne({ where: { referralCode } });

    if (referrer) {
      // Use update query to set referredBy using userId
      await User.update(
        { referredBy: referralCode },
        { where: { userId: newUserId } }
      );
    }
  } catch (error) {
    console.error('Error handling referral tracking:', error);
  }
}


// User Signup
router.post('/signup', async (req, res) => {

  console.log("🟢 SIGNUP REQUEST RECEIVED");

  try {

    const { name, email, password, ref } = req.body;

    console.log("📩 Signup details received:", {
      name,
      email,
      ref
    });


    // CREATE USER ID
    const userId =
      `QS9-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log("🆔 Generated userId:", userId);


    // CHECK IF EMAIL EXISTS
    console.log("🔍 Checking if email already exists...");

    const existingUser =
      await User.findOne({
        where: { email }
      });


    if (existingUser) {

      console.log(
        "⚠️ Signup stopped: Email already exists:",
        email
      );

      return res.status(400).json({
        error: "This email already exists."
      });

    }


    // CREATE USER
    console.log("👤 Creating user...");

    const user = await User.create({
      name,
      email,
      password,
      userId,
      balance: 250,
      demoBalance: 1000
    });

    console.log(
      "✅ USER CREATED SUCCESSFULLY:",
      user.userId
    );


    // HANDLE REFERRAL
    if (ref) {

      console.log(
        "🎁 Processing referral:",
        ref
      );

      await handleReferralTracking(
        ref,
        user.userId
      );

      console.log(
        "✅ Referral processing completed"
      );

    } else {

      console.log(
        "ℹ️ No referral code provided"
      );

    }


    // CREATE VERIFICATION LINK
    console.log(
      "🔗 Creating verification link..."
    );

    const verificationLink =
      `${process.env.BASE_URL}/auth/verify/${userId}`;

    console.log(
      "🔗 Verification link:",
      verificationLink
    );


    // SEND VERIFICATION EMAIL
    console.log(
      "📧 Attempting to send verification email to:",
      email
    );

    await sendVerificationEmail(
      email,
      verificationLink
    );

    console.log(
      "✅ VERIFICATION EMAIL SENT SUCCESSFULLY"
    );


    // SEND RESPONSE TO FRONTEND
    console.log(
      "🚀 Sending success response to frontend..."
    );

    return res.status(201).json({
      message:
        "User created. Check your email to verify."
    });


  } catch (error) {

    console.error(
      "❌ SIGNUP ERROR:"
    );

    console.error(error);

    console.error(
      "❌ Error message:",
      error.message
    );

    console.error(
      "❌ Error stack:",
      error.stack
    );

    return res.status(500).json({
      error: error.message
    });

  }

});

// Shareholder Signup
router.post('/share-signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const memberId = `QS9SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const existingMember = await Member.findOne({ where: { email } });
    if (existingMember) return res.status(400).json({ error: "This email already exists." });

    const member = await Member.create({
      name,
      email,
      password,
      memberId,
      shareBalance: 0,
      contributedShare: 0,
      sharePercentage: 0,
    });

    const verificationLink = `${process.env.BASE_URL}/auth/share-verify/${memberId}`;
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'Member created. Check your email to verify.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

    if (user.blockUntil && new Date() < user.blockUntil) {
      const remainingTime = Math.ceil((user.blockUntil - new Date()) / 60000);
      return res.status(403).json({ message: `Blocked. Try again in ${remainingTime} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 4) {
        user.blockUntil = new Date(Date.now() + 60 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.failedAttempts = 0;
    user.blockUntil = null;
    await user.save();

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: {
        name: user.name,
        userId: user.userId,
        balance: user.balance,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share Login
router.post('/share-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const member = await Member.findOne({ where: { email } });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    if (!member.isVerified) return res.status(403).json({ message: 'Email not verified' });

    if (member.blockUntil && new Date() < member.blockUntil) {
      const remainingTime = Math.ceil((member.blockUntil - new Date()) / 60000);
      return res.status(403).json({ message: `Blocked. Try again in ${remainingTime} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      member.failedAttempts += 1;
      if (member.failedAttempts >= 4) {
        member.blockUntil = new Date(Date.now() + 60 * 60 * 1000);
      }
      await member.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    member.failedAttempts = 0;
    member.blockUntil = null;
    await member.save();

    const token = jwt.sign({ memberId: member.memberId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      member: {
        name: member.name,
        memberId: member.memberId,
        shareBalance: member.shareBalance,
        contributedShare: member.contributedShare,
        sharePercentage: member.sharePercentage,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email verification (User)
router.get('/verify/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ where: { userId: req.params.userId } });
    if (!user) return res.status(404).send('<h1>User not found</h1>');
    if (user.isVerified) return res.redirect(`${process.env.FRONTEND_URL}/#/login`);

    user.isVerified = true;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL}/#/login`);

    
  } catch (error) {
    res.status(500).send(`<h1>Verification Failed</h1><p>${error.message}</p>`);
  }
});


// Forgot Password (User)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/#/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetLink);
    res.json({ message: "Reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Error processing request" });
  }
});

// Reset Password (User)
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: crypto.createHash("sha256").update(token).digest("hex"),
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Repeat the same for share-reset-password and share-forgot-password...
// Share Forgot Password
router.post('/share-forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const member = await Member.findOne({ where: { email } });
    if (!member) return res.status(400).json({ message: "Member not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    member.resetPasswordToken = hashedToken;
    member.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await member.save();

    const resetLink = `${process.env.FRONTEND_URL}/share-reset-password/${resetToken}`;
    await sendVerificationEmail(email, resetLink);
    res.json({ message: "Reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Error processing request" });
  }
});


module.exports = router; // ✅ CORRECT