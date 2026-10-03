const express = require("express");
const router = express.Router();
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const User = require("../models/User");
const ETrendAccount = require("../models/ETrendAccount");
const ETrendTransfer = require("../models/ETrendTransfer");


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

    const transferAmount =
      Number(amount);

    if (
      !Number.isFinite(
        transferAmount
      ) ||
      transferAmount < 100
    ) {
      return res.status(400).json({
        message:
          "Minimum withdrawal amount is ₦100."
      });
    }

    if (
      !/^\d{10}$/.test(
        String(accountNumber)
      )
    ) {
      return res.status(400).json({
        message:
          "Account number must be exactly 10 digits."
      });
    }

    // ==========================================================
    // 2. FIND ETREND ACCOUNT
    // ==========================================================

    const account =
      await ETrendAccount.findOne({
        where: {
          userId
        }
      });

    if (!account) {
      return res.status(404).json({
        message:
          "ETrend account not found."
      });
    }

    if (
      !account.flutterwaveAccountReference
    ) {
      return res.status(400).json({
        message:
          "Flutterwave account reference is missing."
      });
    }

    // ==========================================================
    // IMPORTANT:
    // DO NOT CHECK account.status === "ACTIVE"
    //
    // The local ETrend status is not the Flutterwave
    // transfer status.
    // ==========================================================

    // ==========================================================
    // 3. CALCULATE ETREND FEE
    // ==========================================================

    const serviceFee =
      Number(
        (
          transferAmount *
          0.009
        ).toFixed(2)
      );

    const totalRequired =
      Number(
        (
          transferAmount +
          serviceFee
        ).toFixed(2)
      );

    console.log(
      "======================================"
    );

    console.log(
      "ETREND TRANSFER REQUEST"
    );

    console.log(
      "User:",
      userId
    );

    console.log(
      "Transfer amount:",
      transferAmount
    );

    console.log(
      "ETrend service fee:",
      serviceFee
    );

    console.log(
      "Total required:",
      totalRequired
    );

    console.log(
      "======================================"
    );

    // ==========================================================
    // 4. CHECK ETREND WALLET BALANCE
    // ==========================================================

    const balanceResponse =
      await axios.get(
        `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/balances`,
        {
          headers: {
            Authorization:
              `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json"
          },

          params: {
            currency:
              "NGN"
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

    if (
      Array.isArray(
        balanceData
      )
    ) {

      const ngnBalance =
        balanceData.find(
          item =>
            String(
              item.currency
            ).toUpperCase() ===
            "NGN"
        );

      availableBalance =
        Number(
          ngnBalance?.available ||
          ngnBalance?.available_balance ||
          0
        );

    } else if (
      balanceData
    ) {

      availableBalance =
        Number(
          balanceData.available ||
          balanceData.available_balance ||
          0
        );
    }

    if (
      !Number.isFinite(
        availableBalance
      )
    ) {
      availableBalance = 0;
    }

    console.log(
      "Available ETrend balance:",
      availableBalance
    );

    // ==========================================================
    // 5. MAKE SURE USER HAS ENOUGH FOR:
    //
    // withdrawal + ETrend fee
    // ==========================================================

    if (
      availableBalance <
      totalRequired
    ) {
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
    // 6. CREATE UNIQUE WITHDRAWAL REFERENCE
    // ==========================================================

    const reference =
      `ETREND_${userId}_${Date.now()}`;

    // ==========================================================
    // 7. CREATE LOCAL TRANSFER RECORD FIRST
    // ==========================================================

    const etrendTransfer =
      await ETrendTransfer.create({
        userId,

        reference,

        amount:
          transferAmount,

        etrendFee:
          serviceFee,

        status:
          "NEW",

        feeStatus:
          "PENDING"
      });

    // ==========================================================
    // 8. INITIATE FLUTTERWAVE BANK TRANSFER
    // ==========================================================

    let transferResponse;

    try {

      transferResponse =
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

    } catch (transferError) {

      console.error(
        "❌ Flutterwave transfer request failed:"
      );

      console.error(
        transferError.response?.data ||
        transferError.message
      );

      await etrendTransfer.update({
        status:
          "FAILED",

        feeStatus:
          "NOT_CHARGED"
      });

      return res.status(400).json({
        message:
          transferError.response?.data?.message ||
          "Flutterwave could not initiate the withdrawal."
      });
    }

    // ==========================================================
    // 9. LOG FLUTTERWAVE RESPONSE
    // ==========================================================

    console.log(
      "Flutterwave transfer response:",
      JSON.stringify(
        transferResponse.data,
        null,
        2
      )
    );

    // ==========================================================
    // 10. CHECK FLUTTERWAVE API RESPONSE
    // ==========================================================

    if (
      transferResponse.data?.status !==
      "success"
    ) {

      await etrendTransfer.update({
        status:
          "FAILED",

        feeStatus:
          "NOT_CHARGED"
      });

      return res.status(400).json({
        message:
          transferResponse.data?.message ||
          "Flutterwave could not initiate the withdrawal."
      });
    }

    // ==========================================================
    // 11. GET FLUTTERWAVE TRANSFER DATA
    // ==========================================================

    const transfer =
      transferResponse.data?.data;

    const transferId =
      transfer?.id || null;

    const transferStatus =
      String(
        transfer?.status ||
        "NEW"
      ).toUpperCase();

    const flutterwaveFee =
      Number(
        transfer?.fee || 0
      );

    // ==========================================================
    // 12. UPDATE LOCAL RECORD
    // ==========================================================

    await etrendTransfer.update({
      flutterwaveTransferId:
        transferId
          ? String(
              transferId
            )
          : null,

      status:
        transferStatus,

      flutterwaveFee
    });

    // ==========================================================
    // 13. IMPORTANT:
    //
    // DO NOT COLLECT ETREND FEE HERE.
    //
    // Flutterwave normally returns NEW first.
    // The webhook will collect the fee only when the
    // bank transfer becomes SUCCESSFUL.
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

        flutterwaveFee
      },

      etrendFee: {
        rate:
          "0.9%",

        amount:
          serviceFee,

        totalDebit:
          totalRequired,

        charged:
          false,

        status:
          "PENDING"
      }
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


router.post("/webhook", async (req, res) => {
  try {
    console.log("======================================");
    console.log("FLUTTERWAVE ETREND WEBHOOK RECEIVED");
    console.log("======================================");

    // ==========================================================
    // 1. VERIFY FLUTTERWAVE WEBHOOK SECRET HASH
    // ==========================================================

    const secretHash =
      process.env.FLW_SECRET_HASH;

    const receivedHash =
      req.headers["verif-hash"];

    console.log(
      "Flutterwave verif-hash received:",
      !!receivedHash
    );

    console.log(
      "FLW_SECRET_HASH configured:",
      !!secretHash
    );

    if (!receivedHash || !secretHash) {
      console.error(
        "❌ Missing Flutterwave webhook secret hash."
      );

      return res.status(401).json({
        message: "Invalid webhook."
      });
    }

    if (receivedHash !== secretHash) {
      console.error(
        "❌ Flutterwave webhook secret hash does not match."
      );

      return res.status(401).json({
        message: "Invalid webhook signature."
      });
    }

    console.log(
      "✅ Flutterwave webhook secret hash verified."
    );

    // ==========================================================
    // 2. READ WEBHOOK
    // ==========================================================

    const event =
      req.body?.event;

    const transfer =
      req.body?.data;

    console.log(
      "Webhook event:",
      event
    );

    console.log(
      "Webhook data:",
      JSON.stringify(
        transfer,
        null,
        2
      )
    );

    // ==========================================================
    // 3. IGNORE OTHER EVENTS
    // ==========================================================

    if (
      event !==
      "transfer.completed"
    ) {
      console.log(
        "ℹ️ Event ignored:",
        event
      );

      return res.sendStatus(200);
    }

    if (!transfer) {
      console.error(
        "❌ Transfer data missing."
      );

      return res.sendStatus(200);
    }

    // ==========================================================
    // 4. GET TRANSFER DETAILS
    // ==========================================================

    const reference =
      transfer.reference;

    const transferId =
      transfer.id;

    const transferStatus =
      String(
        transfer.status || ""
      )
        .trim()
        .toUpperCase();

    const flutterwaveFee =
      Number(
        transfer.fee || 0
      );

    if (!reference) {
      console.error(
        "❌ Transfer reference missing."
      );

      return res.sendStatus(200);
    }

    console.log(
      "Transfer reference:",
      reference
    );

    console.log(
      "Transfer ID:",
      transferId
    );

    console.log(
      "Transfer status:",
      transferStatus
    );

    console.log(
      "Flutterwave transfer fee:",
      flutterwaveFee
    );

    // ==========================================================
    // 5. FIND OUR ETREND TRANSFER
    // ==========================================================

    const etrendTransfer =
      await ETrendTransfer.findOne({
        where: {
          reference
        }
      });

    if (!etrendTransfer) {
      console.log(
        "ℹ️ Transfer does not belong to ETrend:",
        reference
      );

      return res.sendStatus(200);
    }

    console.log(
      "✅ ETrend transfer found."
    );

    // ==========================================================
    // 6. UPDATE PROVIDER TRANSFER INFORMATION
    // ==========================================================

    if (transferId) {
      etrendTransfer.flutterwaveTransferId =
        String(transferId);
    }

    etrendTransfer.status =
      transferStatus;

    etrendTransfer.flutterwaveFee =
      flutterwaveFee;

    if (
      transferStatus ===
      "SUCCESSFUL"
    ) {
      etrendTransfer.completedAt =
        etrendTransfer.completedAt ||
        new Date();
    }

    await etrendTransfer.save();

    // ==========================================================
    // 7. SUCCESSFUL TRANSFER
    // ==========================================================

    if (
      transferStatus ===
      "SUCCESSFUL"
    ) {
      console.log(
        "✅ Flutterwave transfer was SUCCESSFUL."
      );
    }

    // ==========================================================
    // 8. FAILED TRANSFER
    // ==========================================================

    if (
      transferStatus ===
      "FAILED"
    ) {
      console.log(
        "❌ Flutterwave transfer FAILED."
      );

      console.log(
        "No ETrend service fee will be collected."
      );

      /*
       * Do not overwrite CHARGED or PROCESSING
       * in the unlikely event a duplicate/late
       * webhook arrives.
       */

      if (
        etrendTransfer.feeStatus !==
          "CHARGED" &&
        etrendTransfer.feeStatus !==
          "PROCESSING"
      ) {
        etrendTransfer.feeStatus =
          "NOT_CHARGED";

        await etrendTransfer.save();
      }

      return res.sendStatus(200);
    }

    // ==========================================================
    // 9. IGNORE INTERMEDIATE TRANSFER STATUS
    // ==========================================================

    if (
      transferStatus !==
      "SUCCESSFUL"
    ) {
      console.log(
        "ℹ️ Transfer is not yet successful."
      );

      console.log(
        "Current Flutterwave status:",
        transferStatus
      );

      console.log(
        "ETrend service fee will NOT be collected yet."
      );

      return res.sendStatus(200);
    }

    // ==========================================================
    // 10. PREVENT DUPLICATE FEE COLLECTION
    // ==========================================================

    if (
      etrendTransfer.feeStatus ===
        "CHARGED" ||
      etrendTransfer.feeStatus ===
        "PROCESSING" ||
      etrendTransfer.feeTransferStatus ===
        "SUCCESSFUL"
    ) {
      console.log(
        "ℹ️ ETrend service fee has already been processed."
      );

      console.log(
        "Fee status:",
        etrendTransfer.feeStatus
      );

      console.log(
        "Fee transfer status:",
        etrendTransfer.feeTransferStatus
      );

      return res.sendStatus(200);
    }

    // ==========================================================
    // 11. CALCULATE ETREND SERVICE FEE
    // ==========================================================

    const transferAmount =
      Number(
        etrendTransfer.amount
      );

    if (
      !Number.isFinite(
        transferAmount
      ) ||
      transferAmount <= 0
    ) {
      console.error(
        "❌ Invalid ETrend transfer amount:",
        etrendTransfer.amount
      );

      etrendTransfer.feeStatus =
        "FAILED";

      await etrendTransfer.save();

      return res.sendStatus(200);
    }

    const serviceFee =
      Number(
        (
          transferAmount *
          0.009
        ).toFixed(2)
      );

    console.log(
      "--------------------------------------"
    );

    console.log(
      "ETrend withdrawal amount:",
      transferAmount
    );

    console.log(
      "Flutterwave transfer fee:",
      flutterwaveFee
    );

    console.log(
      "ETrend service fee (0.9%):",
      serviceFee
    );

    console.log(
      "--------------------------------------"
    );

    // ==========================================================
    // 12. FIND USER'S ETREND ACCOUNT
    // ==========================================================

    const etrendAccount =
      await ETrendAccount.findOne({
        where: {
          userId:
            etrendTransfer.userId
        }
      });

    if (!etrendAccount) {
      console.error(
        "❌ ETrend account not found for user:",
        etrendTransfer.userId
      );

      etrendTransfer.feeStatus =
        "FAILED";

      await etrendTransfer.save();

      return res.sendStatus(200);
    }

    if (
      !etrendAccount.flutterwaveAccountReference
    ) {
      console.error(
        "❌ Flutterwave ETrend subaccount reference missing."
      );

      etrendTransfer.feeStatus =
        "FAILED";

      await etrendTransfer.save();

      return res.sendStatus(200);
    }

    // ==========================================================
    // 13. SAVE CALCULATED FEE
    // ==========================================================

    etrendTransfer.etrendFee =
      serviceFee;

    etrendTransfer.feeStatus =
      "PROCESSING";

    await etrendTransfer.save();

    // ==========================================================
    // 14. CREATE UNIQUE FEE TRANSFER REFERENCE
    // ==========================================================

    const feeReference =
      `ETREND_FEE_${etrendTransfer.userId}_${Date.now()}`;

    console.log(
      "ETrend fee transfer reference:",
      feeReference
    );

    // ==========================================================
    // 15. TRANSFER ETREND SERVICE FEE TO MERCHANT
    // ==========================================================

    try {
      const feeTransferResponse =
        await axios.post(
          "https://api.flutterwave.com/v3/transfers",
          {
            account_bank:
              "flutterwave",

            account_number:
              "1735584835777",

            amount:
              serviceFee,

            currency:
              "NGN",

            debit_currency:
              "NGN",

            debit_subaccount:
              etrendAccount
                .flutterwaveAccountReference,

            reference:
              feeReference,

            narration:
              "ETrend Transfer Service Fee",

            callback_url:
              "https://trendgame-backend.onrender.com/api/etrend-account/webhook"
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
        "======================================"
      );

      console.log(
        "ETREND SERVICE FEE TRANSFER RESPONSE"
      );

      console.log(
        JSON.stringify(
          feeTransferResponse.data,
          null,
          2
        )
      );

      console.log(
        "======================================"
      );

      const feeTransfer =
        feeTransferResponse.data?.data;

      etrendTransfer.feeTransferReference =
        feeReference;

      etrendTransfer.feeTransferId =
        feeTransfer?.id
          ? String(
              feeTransfer.id
            )
          : null;

      etrendTransfer.feeTransferStatus =
        String(
          feeTransfer?.status ||
          "NEW"
        )
          .trim()
          .toUpperCase();

      /*
       * Flutterwave may initially return NEW.
       *
       * That does NOT mean the fee transfer
       * has finally succeeded.
       */

      if (
        etrendTransfer.feeTransferStatus ===
        "SUCCESSFUL"
      ) {
        etrendTransfer.feeStatus =
          "CHARGED";

        console.log(
          "✅ ETrend service fee transfer was SUCCESSFUL."
        );
      } else if (
        etrendTransfer.feeTransferStatus ===
        "FAILED"
      ) {
        etrendTransfer.feeStatus =
          "FAILED";

        console.error(
          "❌ ETrend service fee transfer FAILED."
        );
      } else {
        etrendTransfer.feeStatus =
          "PROCESSING";

        console.log(
          "⏳ ETrend service fee transfer is still processing."
        );
      }

      await etrendTransfer.save();

    } catch (feeError) {

      console.error(
        "❌ ETrend service fee transfer failed:"
      );

      console.error(
        feeError.response?.data ||
        feeError.message
      );

      etrendTransfer.feeStatus =
        "FAILED";

      await etrendTransfer.save();
    }

    // ==========================================================
    // 16. ACKNOWLEDGE WEBHOOK
    // ==========================================================

    return res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ ETrend webhook processing failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    /*
     * Flutterwave expects HTTP 200 when the webhook
     * has been received successfully.
     */

    return res.sendStatus(200);
  }
});
module.exports = router;