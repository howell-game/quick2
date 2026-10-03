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

router.post("/transfer", async (req, res) => {
  try {
    const {
      userId,
      amount,
      accountNumber,
      bankCode
    } = req.body;

    // ==========================================================
    // 1. VALIDATE REQUEST
    // ==========================================================

    if (
      !userId ||
      !amount ||
      !accountNumber ||
      !bankCode
    ) {
      return res.status(400).json({
        message:
          "User ID, amount, account number and bank code are required."
      });
    }

    const transferAmount = Number(amount);

    // Minimum withdrawal = ₦100
    if (
      !Number.isFinite(transferAmount) ||
      transferAmount < 100
    ) {
      return res.status(400).json({
        message:
          "Minimum withdrawal amount is ₦100."
      });
    }

    // Nigerian bank account number
    if (!/^\d{10}$/.test(String(accountNumber))) {
      return res.status(400).json({
        message:
          "Account number must be exactly 10 digits."
      });
    }

    // ==========================================================
    // 2. FIND ETREND ACCOUNT
    // ==========================================================

    const account = await ETrendAccount.findOne({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({
        message:
          "ETrend account not found."
      });
    }

    if (!account.flutterwaveAccountReference) {
      return res.status(400).json({
        message:
          "Flutterwave account reference is missing."
      });
    }

    // ==========================================================
    // 3. CALCULATE ETREND SERVICE FEE
    // ==========================================================

    // ETrend service fee = 0.9%
    const serviceFee = Number(
      (transferAmount * 0.009).toFixed(2)
    );

    // Amount required from the user's ETrend account
    // before considering any Flutterwave provider fee.
    const totalRequired = Number(
      (transferAmount + serviceFee).toFixed(2)
    );

    console.log("======================================");
    console.log("ETREND TRANSFER");
    console.log("User:", userId);
    console.log("Transfer amount:", transferAmount);
    console.log("ETrend service fee:", serviceFee);
    console.log("Total required:", totalRequired);
    console.log("======================================");

    // ==========================================================
    // 4. CHECK ETREND FLUTTERWAVE BALANCE
    // ==========================================================

    const balanceResponse = await axios.get(
      `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/balances`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        params: {
          currency: "NGN"
        }
      }
    );

    console.log(
      "Flutterwave ETrend balance:",
      JSON.stringify(
        balanceResponse.data,
        null,
        2
      )
    );

    const balanceData =
      balanceResponse.data?.data;

    let availableBalance = 0;

    if (Array.isArray(balanceData)) {
      const ngnBalance =
        balanceData.find(
          item =>
            String(item.currency).toUpperCase() ===
            "NGN"
        );

      availableBalance = Number(
        ngnBalance?.available ||
        ngnBalance?.available_balance ||
        0
      );
    } else if (balanceData) {
      availableBalance = Number(
        balanceData.available ||
        balanceData.available_balance ||
        0
      );
    }

    if (!Number.isFinite(availableBalance)) {
      availableBalance = 0;
    }

    console.log(
      "Available ETrend balance:",
      availableBalance
    );

    // ==========================================================
    // 5. CHECK AVAILABLE BALANCE
    // ==========================================================

    if (availableBalance < totalRequired) {
      return res.status(400).json({
        message:
          `Insufficient ETrend balance. You need ₦${totalRequired.toLocaleString(
            "en-NG",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }
          )} including the ETrend service fee.`
      });
    }

    // ==========================================================
    // 6. CREATE UNIQUE TRANSFER REFERENCE
    // ==========================================================

    const reference =
      `ETREND_${userId}_${Date.now()}`;

    // ==========================================================
    // 7. SEND MONEY TO CUSTOMER'S BANK ACCOUNT
    // ==========================================================

    const transferResponse =
      await axios.post(
        "https://api.flutterwave.com/v3/transfers",
        {
          account_bank:
            String(bankCode),

          account_number:
            String(accountNumber),

          amount:
            transferAmount,

          currency:
            "NGN",

          debit_currency:
            "NGN",

          // User's ETrend payout subaccount
          debit_subaccount:
            account.flutterwaveAccountReference,

          reference,

          narration:
            "ETrend Account Withdrawal"
        },
        {
          headers: {
            Authorization:
              `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          }
        }
      );

    console.log(
      "Flutterwave transfer response:",
      JSON.stringify(
        transferResponse.data,
        null,
        2
      )
    );

    // ==========================================================
    // 8. CONFIRM FLUTTERWAVE ACCEPTED THE TRANSFER
    // ==========================================================

    if (
      transferResponse.data?.status !==
      "success"
    ) {
      return res.status(400).json({
        message:
          transferResponse.data?.message ||
          "Flutterwave could not initiate the withdrawal."
      });
    }

    const transfer =
      transferResponse.data?.data;

    const transferId =
      transfer?.id || null;

    const transferStatus =
      transfer?.status || null;

    // ==========================================================
    // 9. SERVICE FEE
    // ==========================================================
    //
    // The ETrend fee is 0.9% of the amount being transferred.
    //
    // We DO NOT immediately send the fee to your merchant
    // account when the transfer is merely queued.
    //
    // A proper webhook/status confirmation should confirm
    // the customer's withdrawal before the service fee is
    // finally collected.
    //
    // ==========================================================

    let serviceFeeTransfer = null;

    if (
      String(transferStatus).toUpperCase() ===
      "SUCCESSFUL"
    ) {
      const serviceFeeReference =
        `ETREND_FEE_${userId}_${Date.now()}`;

      const feeTransferResponse =
        await axios.post(
          "https://api.flutterwave.com/v3/transfers",
          {
            // Flutterwave merchant account
            account_bank:
              "flutterwave",

            // Your Flutterwave Merchant ID
            account_number:
              "1735584835777",

            amount:
              serviceFee,

            currency:
              "NGN",

            debit_currency:
              "NGN",

            // Take the service fee from the
            // customer's ETrend payout subaccount
            debit_subaccount:
              account.flutterwaveAccountReference,

            reference:
              serviceFeeReference,

            narration:
              "ETrend Transfer Service Fee"
          },
          {
            headers: {
              Authorization:
                `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
              "Content-Type":
                "application/json",
              Accept:
                "application/json"
            }
          }
        );

      console.log(
        "ETrend service fee response:",
        JSON.stringify(
          feeTransferResponse.data,
          null,
          2
        )
      );

      serviceFeeTransfer =
        feeTransferResponse.data?.data ||
        null;
    }

    // ==========================================================
    // 10. RETURN RESULT
    // ==========================================================

    return res.json({
      success: true,

      message:
        "ETrend withdrawal initiated successfully.",

      transfer: {
        id:
          transferId,

        reference:
          transfer?.reference ||
          reference,

        status:
          transferStatus,

        amount:
          transfer?.amount ||
          transferAmount,

        currency:
          transfer?.currency ||
          "NGN",

        accountNumber:
          transfer?.account_number ||
          accountNumber,

        bankCode:
          transfer?.bank_code ||
          bankCode,

        accountName:
          transfer?.full_name ||
          null,

        flutterwaveFee:
          Number(
            transfer?.fee || 0
          )
      },

      etrendFee: {
        rate: "0.9%",
        amount: serviceFee,
        totalDebit: totalRequired,
        charged:
          !!serviceFeeTransfer
      },

      serviceFeeTransfer:
        serviceFeeTransfer
          ? {
              id:
                serviceFeeTransfer.id ||
                null,

              reference:
                serviceFeeTransfer.reference ||
                null,

              status:
                serviceFeeTransfer.status ||
                null,

              amount:
                serviceFeeTransfer.amount ||
                serviceFee
            }
          : null
    });

  } catch (error) {
    console.error(
      "❌ ETrend transfer failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to process ETrend withdrawal."
    });
  }
});

module.exports = router;