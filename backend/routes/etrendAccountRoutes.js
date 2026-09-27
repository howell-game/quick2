const express = require("express");
const router = express.Router();

const User = require("../models/User");
const ETrendAccount = require("../models/ETrendAccount");


// ==========================================
// CREATE ETrend ACCOUNT
// ==========================================
router.post("/create", async (req, res) => {
  try {

    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      verificationType,
      verificationNumber
    } = req.body;


    // ==========================================
    // CHECK REQUIRED INFORMATION
    // ==========================================

    if (
      !userId ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !verificationType ||
      !verificationNumber
    ) {
      return res.status(400).json({
        message: "Please provide all required information."
      });
    }


    // ==========================================
    // CHECK USER
    // ==========================================

    const user = await User.findOne({
      where: { userId }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }


    // ==========================================
    // CHECK EMAIL VERIFICATION
    // ==========================================

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before creating an ETrend account."
      });
    }


    // ==========================================
    // CHECK IF ACCOUNT ALREADY EXISTS
    // ==========================================

    const existingAccount = await ETrendAccount.findOne({
      where: { userId }
    });

    if (existingAccount) {
      return res.status(409).json({
        message: "You already have an ETrend account.",
        account: existingAccount
      });
    }


    // ==========================================
    // CREATE ETrend ACCOUNT
    // ==========================================

    const account = await ETrendAccount.create({
      userId,
      accountName: `${firstName} ${lastName}`,
      currency: "NGN",
      status: "pending"
    });


    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "ETrend account application submitted successfully.",
      account: {
        id: account.id,
        userId: account.userId,
        accountName: account.accountName,
        currency: account.currency,
        status: account.status
      }
    });

  } catch (error) {

    console.error("❌ ETrend account creation error:", error);

    return res.status(500).json({
      message: "Server error while creating ETrend account."
    });

  }
});


module.exports = router;