const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 15000,

  greetingTimeout: 15000,

  socketTimeout: 30000,

});


// Function to send verification email
async function sendVerificationEmail(
  email,
  verificationLink
) {

  console.log(
    "📧 EMAIL: Starting verification email process..."
  );

  console.log(
    "📧 EMAIL: Recipient:",
    email
  );

  console.log(
    "📧 EMAIL: Checking Yahoo connection..."
  );

  try {

    await transporter.verify();

    console.log(
      "✅ EMAIL: Yahoo connection verified"
    );

  } catch (error) {

    console.error(
      "❌ EMAIL: Yahoo connection verification failed:"
    );

    console.error(error);

    throw error;

  }


  const mailOptions = {

    from:
      `"TrendGame9ja" <${process.env.EMAIL_USER}>`,

    replyTo:
      process.env.EMAIL_USER,

    to:
      email,

    subject:
      "Verify Your Email",

    html: `
      <p>Please verify your email by clicking the link below:</p>

      <a href="${verificationLink}">
        Verify Email
      </a>
    `,

  };


  console.log(
    "📧 EMAIL: Sending email..."
  );


  try {

    const result =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      "✅ EMAIL: Email sent successfully"
    );

    console.log(
      "📧 EMAIL: Message ID:",
      result.messageId
    );

    return result;

  } catch (error) {

    console.error(
      "❌ EMAIL: Failed to send email:"
    );

    console.error(error);

    throw error;

  }

}


module.exports = {
  sendVerificationEmail,
};


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
