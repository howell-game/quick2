
const express = require("express");
const crypto = require("crypto");
const { Transaction: SequelizeTransaction } = require("sequelize");

const router = express.Router();

const sequelize = require("../db");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const ETrendAccount = require("../models/ETrendAccount");

const {
  transfer,
} = require("../services/flutterwaveService");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

const MIN_WITHDRAWAL = 1000;

// The user ID must come from authenticated server-side identity.
function getAuthenticatedUserId(req) {
  return req.user?.userId || req.userId || null;
}

function parseAmount(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount < MIN_WITHDRAWAL ||
    Math.round(amount * 100) !== amount * 100
  ) {
    return null;
  }

  return amount;
}

// POST /api/pawn-withdrawals
router.post("/", async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const amount = parseAmount(req.body.amount);

  if (!userId) {
    return res.status(401).json({
      error: "Please log in to withdraw Pawns.",
    });
  }

  if (amount === null) {
    return res.status(400).json({
      error: `Enter a valid withdrawal amount of at least ₦${MIN_WITHDRAWAL}.`,
    });
  }

  const reference =
    `PAWNWD_${Date.now()}_${crypto.randomUUID().replace(/-/g, "")}`;

  let withdrawal;

  // Step 1: create the withdrawal and deduct the user's balance
  // atomically. The row lock prevents concurrent overspending.
  try {
    await sequelize.transaction(async (dbTransaction) => {
      const user = await User.findOne({
        where: { userId },
        transaction: dbTransaction,
        lock: dbTransaction.LOCK.UPDATE,
      });

      if (!user) {
        const error = new Error("User account not found.");
        error.statusCode = 404;
        throw error;
      }

      const account = await ETrendAccount.findOne({
        where: { userId },
        transaction: dbTransaction,
      });

      if (!account || !account.flutterwaveAccountReference) {
        const error = new Error(
          "Your ETrend Flutterwave account is not configured for withdrawals."
        );
        error.statusCode = 400;
        throw error;
      }

      const currentBalance = Number(user.balance || 0);

      if (!Number.isFinite(currentBalance) || currentBalance < amount) {
        const error = new Error("Insufficient Pawn balance.");
        error.statusCode = 400;
        throw error;
      }

      // Deduct first.
      user.balance = (currentBalance - amount).toFixed(2);
      await user.save({ transaction: dbTransaction });

      // Record the debit so a duplicate request cannot create
      // another withdrawal with the same reference.
      withdrawal = await Transaction.create(
        {
          userId,
          amount: amount.toFixed(2),
          transactionId: reference,
          reference,
          transactionType: "withdrawal",
          status: "pending",
          currency: "NGN",
          verified: false,
          paymentType: "etrend_pawn_withdrawal",
          metadata: {
            destinationAccountReference:
              account.flutterwaveAccountReference,
            debitApplied: true,
            refundApplied: false,
          },
        },
        { transaction: dbTransaction }
      );
    });
  } catch (error) {
    console.error("Pawn withdrawal debit failed:", error);

    return res.status(error.statusCode || 500).json({
      error: error.statusCode
        ? error.message
        : "Unable to create the withdrawal. No transfer was initiated.",
    });
  }

  // Step 2: submit the transfer AFTER the debit and record commit.
  //
  // IMPORTANT:
  // This destination payload is only valid if Flutterwave has confirmed
  // that your account can transfer directly to this ETrend subaccount
  // reference using account_bank="flutterwave".
  //
  // Do not deploy this destination mapping to live funds until verified.
  try {
    const accountReference =
      withdrawal.metadata.destinationAccountReference;

    const response = await transfer({
      account_bank: "flutterwave",
      account_number: accountReference,
      amount,
      currency: "NGN",
      debit_currency: "NGN",
      reference,
      narration: "ETrend Pawn Withdrawal",
      callback_url:
        `${process.env.BASE_URL}/api/etrend-account/webhook`,
    });

    const transferData = response?.data;

    // Save the provider ID if the response supplies one.
    if (transferData?.id) {
      await withdrawal.update({
        flutterwaveId: String(transferData.id),
        status: "processing",
        gatewayResponse: {
          submissionStatus: transferData.status || "submitted",
        },
      });
    } else {
      await withdrawal.update({
        status: "processing",
        gatewayResponse: {
          submissionStatus: "submitted_without_transfer_id",
        },
      });
    }

    return res.status(202).json({
      message:
        "Withdrawal submitted. Your Pawns have been deducted and the transfer is awaiting verification.",
      reference,
      amount,
      status: "processing",
    });
  } catch (error) {
    console.error(
      "Pawn withdrawal transfer submission outcome is uncertain:",
      error.response?.data || error.message
    );

    // A timeout does NOT prove that Flutterwave rejected the transfer.
    // Do not refund here. Reconcile the transfer before refunding.
    await withdrawal.update({
      status: "processing",
      gatewayResponse: {
        submissionStatus: "outcome_uncertain",
      },
    }).catch((saveError) => {
      console.error(
        "Unable to save uncertain withdrawal status:",
        saveError
      );
    });

    return res.status(202).json({
      message:
        "Your withdrawal is being checked. Your Pawns have been deducted, but the transfer outcome is not yet confirmed. Do not submit the same withdrawal again.",
      reference,
      status: "processing",
    });
  }
});

// GET /api/pawn-withdrawals/status/:reference
router.get("/status/:reference", async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({
      error: "Please log in first.",
    });
  }

  try {
    const withdrawal = await Transaction.findOne({
      where: {
        userId,
        reference: req.params.reference,
        transactionType: "withdrawal",
        paymentType: "etrend_pawn_withdrawal",
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

    if (!withdrawal) {
      return res.status(404).json({
        error: "Withdrawal not found.",
      });
    }

    return res.json({ withdrawal });
  } catch (error) {
    console.error("Pawn withdrawal status error:", error);

    return res.status(500).json({
      error: "Unable to retrieve withdrawal status.",
    });
  }
});

module.exports = router;
