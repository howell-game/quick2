const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Yahoo",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send verification email
async function sendVerificationEmail(email, verificationLink) {
  const mailOptions = {
    from: `"TrendGame9ja" <${process.env.EMAIL_USER}>`, // Customized sender name here
    replyTo: process.env.EMAIL_USER, 
    to: email,
    subject: "Verify Your Email",
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verificationLink}">Verify Email</a>`,
  };

  return transporter.sendMail(mailOptions);
}

// Function to send OTP for withdrawal
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: `"TrendGame9ja" <${process.env.EMAIL_USER}>`, // Customized sender name here
    replyTo: process.env.EMAIL_USER, 
    to: email,
    subject: "Withdrawal Verification Code",
    text: `Your withdrawal verification code is: ${otp}. It expires in 10 minutes.`,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}

// Function to send password reset email
async function sendPasswordResetEmail(email, resetLink) {
  const mailOptions = {
    from: `"TrendGame9ja" <${process.env.EMAIL_USER}>`, // Customized sender name here
    replyTo: process.env.EMAIL_USER, 
    to: email,
    subject: "Password Reset Request",
    html: `<p>You requested a password reset. Click the link below to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>
           <p>This link expires in 1 hour.</p>`,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

module.exports = { sendVerificationEmail, sendOtpEmail, sendPasswordResetEmail };
