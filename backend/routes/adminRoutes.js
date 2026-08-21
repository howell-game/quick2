const express = require("express");
const UnresolvedIssue = require("../models/UnresolvedIssue");
require('dotenv').config();
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const PlatformFee = require("../models/PlatformFee");
const InvestmentSelection = require("../models/InvestmentSelection");
const Transaction = require("../models/Transaction");
const router = express.Router();

// Get unresolved issues
router.get("/unresolved-issues", async (req, res) => {
  try {
    const issues = await UnresolvedIssue.find({ resolved: false });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: "Error fetching unresolved issues" });
  }
});

// Mark issue as resolved
router.post("/resolve-issue", async (req, res) => {
  try {
    await UnresolvedIssue.findByIdAndUpdate(req.body.issueId, { resolved: true });
    res.json({ message: "Issue resolved" });
  } catch (err) {
    res.status(500).json({ error: "Error resolving issue" });
  }
});


// =====================================================
// ADMIN DASHBOARD DATA
// GET /api/admin/dashboard
// =====================================================

router.get("/dashboard", async (req, res) => {

  try {

    // ==========================================
    // 1. TOTAL USERS
    // ==========================================

    const users = await User.count();


    // ==========================================
    // 2. UNRESOLVED CHAT ISSUES
    // ==========================================

    const issues = await ChatMessage.count({
      where: {
        resolved: false
      }
    });


    // ==========================================
    // 3. PLATFORM FEES
    // ==========================================

    const platformFeeRecord = await PlatformFee.findOne({
      where: {
        type: "main"
      }
    });


    const platformFees = platformFeeRecord
      ? Number(platformFeeRecord.totalFees || 0)
      : 0;


    // ==========================================
    // 4. TOTAL USER BALANCE
    // ==========================================

    const totalUserBalanceResult = await User.sum("balance");

    const totalUserBalance =
      Number(totalUserBalanceResult || 0);


    // ==========================================
    // 5. ACTIVE INVESTMENTS
    // ==========================================

    const activeInvestments =
      await InvestmentSelection.count({
        where: {
          status: "active"
        }
      });


    // ==========================================
    // 6. AWAITING INVESTMENTS
    // ==========================================

    const awaitingInvestments =
      await InvestmentSelection.count({
        where: {
          status: "awaiting"
        }
      });


    // ==========================================
    // 7. PENDING WITHDRAWALS
    //
    // Only withdrawal transactions whose
    // status is NOT successful.
    // ==========================================

    const pendingWithdrawals =
      await Transaction.count({
        where: {
          transactionType: "withdrawal",

          status: {
            [Op.ne]: "successful"
          }
        }
      });


    // ==========================================
    // 8. GET THE ACTUAL WITHDRAWAL TRANSACTIONS
    // ==========================================

    const withdrawalTransactions =
      await Transaction.findAll({

        where: {
          transactionType: "withdrawal",

          status: {
            [Op.ne]: "successful"
          }
        },

        order: [
          ["createdAt", "DESC"]
        ],

      });


    // ==========================================
    // SEND EVERYTHING TO FRONTEND
    // ==========================================

    res.json({

      stats: {

        users,

        issues,

        platformFees,

        totalUserBalance,

        activeInvestments,

        awaitingInvestments,

        pendingWithdrawals,

      },

      withdrawalTransactions,

    });


  } catch (error) {

    console.error(
      "Admin dashboard error:",
      error
    );

    res.status(500).json({
      error: "Failed to load admin dashboard data"
    });

  }

});



// =====================================================
// RESOLVE WITHDRAWAL
// PUT /api/admin/transactions/:id/resolve
// =====================================================

router.put(
  "/transactions/:id/resolve",
  async (req, res) => {

    try {

      const { id } = req.params;


      // ==========================================
      // FIND TRANSACTION
      // ==========================================

      const transaction =
        await Transaction.findByPk(id);


      if (!transaction) {

        return res.status(404).json({
          error: "Transaction not found"
        });

      }


      // ==========================================
      // MAKE SURE IT IS A WITHDRAWAL
      // ==========================================

      if (
        transaction.transactionType !==
        "withdrawal"
      ) {

        return res.status(400).json({
          error: "This transaction is not a withdrawal"
        });

      }


      // ==========================================
      // ALREADY SUCCESSFUL
      // ==========================================

      if (
        transaction.status ===
        "successful"
      ) {

        return res.status(400).json({
          error: "This withdrawal has already been resolved"
        });

      }


      // ==========================================
      // MARK AS SUCCESSFUL
      // ==========================================

      transaction.status = "successful";

      transaction.updatedAt = new Date();

      await transaction.save();


      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({

        message:
          "Withdrawal resolved successfully",

        transaction,

      });


    } catch (error) {

      console.error(
        "Resolve withdrawal error:",
        error
      );

      res.status(500).json({
        error: "Failed to resolve withdrawal"
      });

    }

  }
);

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================

router.post("/login", async (req, res) => {

  try {

    const {
      username,
      password,
    } = req.body;


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!username || !password) {

      return res.status(400).json({
        error: "Username and password are required",
      });

    }


    // ==========================================
    // FIND ADMIN
    // ==========================================

    const admin = await Admin.findOne({
      where: {
        username,
      },
    });


    if (!admin) {

      return res.status(401).json({
        error: "Invalid username or password",
      });

    }


    // ==========================================
    // CHECK ACTIVE STATUS
    // ==========================================

    if (!admin.isActive) {

      return res.status(403).json({
        error: "This admin account is disabled",
      });

    }


    // ==========================================
    // COMPARE PASSWORD
    // ==========================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password
      );


    if (!passwordMatch) {

      return res.status(401).json({
        error: "Invalid username or password",
      });

    }


    // ==========================================
    // UPDATE LAST LOGIN
    // ==========================================

    admin.lastLogin = new Date();

    await admin.save();


    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({

      message: "Admin login successful",

      admin: {
        id: admin.id,
        username: admin.username,
      },

    });


  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    res.status(500).json({
      error: "Unable to login",
    });

  }

});

module.exports = router;
