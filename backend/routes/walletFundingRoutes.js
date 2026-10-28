
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const { Op } = require("sequelize");

const sequelize = require("../db");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ETrendAccount = require("../models/ETrendAccount");

const {
  transfer,
  getTransfer,
} = require("../services/flutterwaveService");

const authMiddleware = require("../middleware/authMiddleware");

// Merchant destination already used by your existing webhook.
const MERCHANT_BANK = "flutterwave";
const MERCHANT_ACCOUNT = "100660060";

router.use(authMiddleware);

// ----------------------------------------------------------
// HELPER: GET AUTHENTICATED USER
// ----------------------------------------------------------

function getAuthenticatedUserId(req) {
  return req.user?.userId || req.userId || null;
}

// ----------------------------------------------------------
// HELPER: COMPARE NAIRA AMOUNTS WITHOUT FLOATING-POINT ERRORS
// ----------------------------------------------------------

function toKobo(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  const rounded = Math.round(amount * 100);

  if (Math.abs(amount * 100 - rounded) > 0.000001) {
    return null;
  }

  return rounded;
}

// ----------------------------------------------------------
// POST /api/wallet-funding/deposit
//
// Creates a pending deposit and submits a transfer from the
// user's ETrend Flutterwave subaccount to the merchant.
// The balance is NOT credited by this endpoint.
// ----------------------------------------------------------

router.post("/deposit", async (req, res) => {
  let deposit = null;

  try {
    const userId = getAuthenticatedUserId(req);
    const amountKobo = toKobo(req.body?.amount);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (amountKobo === null || amountKobo <= 0) {
      return res.status(400).json({
        success: false,
        error: "Enter a valid amount greater than zero with no more than two decimal places.",
      });
    }

    const user = await User.findOne({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User account not found.",
      });
    }

    const account = await ETrendAccount.findOne({
      where: { userId },
    });

    if (
      !account ||
      !account.flutterwaveAccountReference
    ) {
      return res.status(400).json({
        success: false,
        error: "Your ETrend Flutterwave subaccount is not available.",
      });
    }

    const amount = (amountKobo / 100).toFixed(2);
    const reference = `DEP_${crypto.randomUUID()}`;

    // Persist the deposit before contacting Flutterwave.
    deposit = await Transaction.create({
      userId,
      amount,
      reference,
      transactionId: reference,
      transactionType: "deposit",
      status: "pending",
      currency: "NGN",
      verified: false,
      paymentType: "flutterwave_subaccount_transfer",
    });

    try {
      const response = await transfer({
        account_bank: MERCHANT_BANK,
        account_number: MERCHANT_ACCOUNT,
        amount: Number(amount),
        currency: "NGN",
        debit_currency: "NGN",
        debit_subaccount: account.flutterwaveAccountReference,
        reference,
        narration: "ETrend Wallet Funding",
        callback_url:
          `${process.env.BASE_URL}/api/etrend-account/webhook`,
      });

      const transferData = response?.data?.data;

      // A successful API submission is NOT proof of a
      // completed transfer. Wait for a verified final result.
      if (transferData?.id) {
        deposit.flutterwaveId = String(transferData.id);
      }

      deposit.status = "processing";
      deposit.gatewayResponse = JSON.stringify({
        submissionStatus: transferData?.status || "UNKNOWN",
      });

      await deposit.save();

      return res.status(202).json({
        success: true,
        message:
          "Your wallet funding transfer was submitted. Your balance will be updated after Flutterwave confirms the transfer.",
        reference,
        status: deposit.status,
      });
    } catch (transferError) {
      // A timeout or network error does not prove that
      // Flutterwave rejected the transfer. Do not retry here.
      console.error(
        "Wallet funding submission outcome uncertain:",
        transferError.response?.data ||
          transferError.message
      );

      await deposit.update({
        status: "processing",
        gatewayResponse: JSON.stringify({
          submissionStatus: "OUTCOME_UNCERTAIN",
        }),
      });

      return res.status(202).json({
        success: true,
        message:
          "The transfer outcome is being checked. Do not submit another transfer until this one has been reconciled.",
        reference,
        status: "processing",
      });
    }
  } catch (error) {
    console.error(
      "Wallet funding error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: "Could not initialize wallet funding.",
    });
  }
});

// ----------------------------------------------------------
// GET /api/wallet-funding/status/:reference
//
// Allows the authenticated user to check their own deposit.
// ----------------------------------------------------------

router.get("/status/:reference", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const deposit = await Transaction.findOne({
      where: {
        userId,
        reference: req.params.reference,
        transactionType: "deposit",
      },
      attributes: [
        "reference",
        "amount",
        "currency",
        "status",
        "verified",
        "createdAt",
        "paidAt",
      ],
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: "Deposit not found.",
      });
    }

    return res.json({
      success: true,
      deposit,
    });
  } catch (error) {
    console.error(
      "Wallet funding status error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      error: "Could not retrieve deposit status.",
    });
  }
});

module.exports = router;
