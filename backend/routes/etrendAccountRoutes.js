const express = require("express");
const router = express.Router();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

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
        message:
          "Please verify your email before creating an ETrend account."
      });

    }


    // ==========================================
    // CHECK EXISTING ETREND ACCOUNT
    // ==========================================

    const existingAccount = await ETrendAccount.findOne({
      where: { userId }
    });

    if (existingAccount) {

      return res.status(409).json({
        message: "You already have an ETrend account."
      });

    }


    // ==========================================
    // CREATE UNIQUE REFERENCE
    // ==========================================

    const accountReference = `ETREND-${uuidv4()}`;


    // ==========================================
    // CREATE FLUTTERWAVE PSA WALLET
    // ==========================================

    console.log(
      "Creating Flutterwave PSA wallet..."
    );


    const walletResponse = await axios.post(

      "https://api.flutterwave.com/v3/payout-subaccounts",

      {
        account_name: `${firstName} ${lastName}`,
        email: email,
        country: "NG"
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

          "Content-Type": "application/json"
        }
      }

    );


    // ==========================================
    // CHECK WALLET RESPONSE
    // ==========================================

    if (
      !walletResponse.data ||
      walletResponse.data.status !== "success"
    ) {

      console.error(
        "Flutterwave wallet creation failed:",
        walletResponse.data
      );

      return res.status(400).json({
        message:
          "Flutterwave could not create your account."
      });

    }


    const wallet =
      walletResponse.data.data;


    console.log(
      "Flutterwave wallet created:",
      wallet.account_reference
    );


    // ==========================================
    // ISSUE STATIC VIRTUAL ACCOUNT
    // ==========================================

    console.log(
      "Issuing Flutterwave virtual account..."
    );


    const virtualAccountResponse = await axios.get(

      `https://api.flutterwave.com/v3/payout-subaccounts/${wallet.account_reference}/static-account`,

      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

          "Content-Type": "application/json"
        }
      }

    );


    // ==========================================
    // CHECK VIRTUAL ACCOUNT RESPONSE
    // ==========================================

    if (
      !virtualAccountResponse.data ||
      virtualAccountResponse.data.status !== "success"
    ) {

      console.error(
        "Flutterwave virtual account creation failed:",
        virtualAccountResponse.data
      );


      // ------------------------------------------
      // IMPORTANT
      // ------------------------------------------
      // The PSA wallet was created but the virtual
      // account failed.
      //
      // We do NOT create the ETrend database
      // record yet.
      // ------------------------------------------

      return res.status(400).json({
        message:
          "Flutterwave created the wallet but could not issue the virtual account."
      });

    }


    const virtualAccount =
      virtualAccountResponse.data.data;


    console.log(
      "Virtual account created:",
      virtualAccount.static_account
    );


    // ==========================================
    // SAVE ETREND ACCOUNT
    // ==========================================

    const account = await ETrendAccount.create({

      userId,

      flutterwaveWalletId:
        wallet.id
          ? String(wallet.id)
          : null,

      flutterwaveAccountReference:
        wallet.account_reference,

      flutterwaveBarterId:
        wallet.barter_id || null,

      accountNumber:
        virtualAccount.static_account ||
        wallet.nuban ||
        null,

      bankName:
        virtualAccount.bank_name ||
        wallet.bank_name ||
        null,

      bankCode:
        virtualAccount.bank_code ||
        wallet.bank_code ||
        null,

      accountName:
        wallet.account_name ||
        `${firstName} ${lastName}`,

      currency:
        virtualAccount.currency ||
        "NGN",

      status:
        wallet.status
          ? wallet.status.toLowerCase()
          : "active"

    });


    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(201).json({

      success: true,

      message:
        "Your ETrend account has been created successfully.",

      account: {

        id: account.id,

        userId: account.userId,

        accountName:
          account.accountName,

        accountNumber:
          account.accountNumber,

        bankName:
          account.bankName,

        bankCode:
          account.bankCode,

        currency:
          account.currency,

        status:
          account.status,

        flutterwaveAccountReference:
          account.flutterwaveAccountReference

      }

    });


  } catch (error) {

    console.error(
      "❌ ETrend account creation error:"
    );

    console.error(
      error.response?.data ||
      error.message
    );


    return res.status(500).json({

      message:
        error.response?.data?.message ||
        "Server error while creating ETrend account."

    });

  }

});


router.get("/balance/:userId", async (req, res) => {
  try {

    const { userId } = req.params;

    // -----------------------------------------
    // FIND ETREND ACCOUNT
    // -----------------------------------------

    const account = await ETrendAccount.findOne({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({
        message: "ETrend account not found."
      });
    }


    // -----------------------------------------
    // CHECK FLUTTERWAVE REFERENCE
    // -----------------------------------------

    if (!account.flutterwaveAccountReference) {
      return res.status(400).json({
        message: "Flutterwave account reference is missing."
      });
    }


    // -----------------------------------------
    // GET FLUTTERWAVE WALLET BALANCE
    // -----------------------------------------

    const response = await axios.get(
      `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/balances`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

          "Content-Type": "application/json"
        },

        params: {
          currency: "NGN"
        }
      }
    );


    console.log(
      "Flutterwave ETrend balance response:",
      JSON.stringify(response.data, null, 2)
    );


    // -----------------------------------------
    // GET BALANCE
    // -----------------------------------------

    const balanceData = response.data?.data;

    let balance = 0;

    if (Array.isArray(balanceData)) {

      const ngnBalance = balanceData.find(
        item => item.currency === "NGN"
      );

      balance = Number(
        ngnBalance?.available ||
        ngnBalance?.available_balance ||
        0
      );

    } else if (balanceData) {

      balance = Number(
        balanceData.available ||
        balanceData.available_balance ||
        0
      );

    }


    // -----------------------------------------
    // RETURN ACCOUNT + BALANCE
    // -----------------------------------------

    return res.json({

      success: true,

      account: {
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        bankCode: account.bankCode,
        currency: account.currency,
        status: account.status
      },

      balance

    });


  } catch (error) {

    console.error(
      "❌ Failed to load ETrend account balance:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({

      message:
        error.response?.data?.message ||
        "Unable to load ETrend account balance."

    });

  }
});

// ==========================================================
// GET ETrend ACCOUNT TRANSACTIONS
// ==========================================================

router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // ------------------------------------------------------
    // Find the user's ETrend account
    // ------------------------------------------------------

    const account = await ETrendAccount.findOne({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({
        message: "ETrend account not found."
      });
    }

    // ------------------------------------------------------
    // Make sure Flutterwave account reference exists
    // ------------------------------------------------------

    if (!account.flutterwaveAccountReference) {
      return res.status(400).json({
        message: "Flutterwave account reference is missing."
      });
    }

    // ------------------------------------------------------
    // Get the last 30 transactions
    // ------------------------------------------------------

    const today = new Date();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };

    const from = formatDate(ninetyDaysAgo);
    const to = formatDate(today);

    const response = await axios.get(
      `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/transactions`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        params: {
          from,
          to,
          currency: "NGN",
          page: 1,
          fetch_limit: 30
        }
      }
    );

    console.log(
      "Flutterwave ETrend transactions response:",
      JSON.stringify(response.data, null, 2)
    );

    // ------------------------------------------------------
    // Get transaction list
    // ------------------------------------------------------

    const transactionData = response.data?.data;

    let transactions = [];

    if (Array.isArray(transactionData)) {
      transactions = transactionData;
    } else if (Array.isArray(transactionData?.transactions)) {
      transactions = transactionData.transactions;
    }

    // ------------------------------------------------------
    // Return transactions to Vuex
    // ------------------------------------------------------

    return res.json({
      success: true,
      transactions
    });

  } catch (error) {

    console.error(
      "❌ Failed to load ETrend transactions:"
    );

    console.error(
      error.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.message ||
        "Unable to load ETrend transactions."
    });
  }
});

module.exports = router;