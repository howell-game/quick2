const express = require("express");
const router = express.Router();
require('dotenv').config();
const User = require("../models/User");
const Member = require("../models/Member");
const { Op } = require('sequelize'); // For advanced queries if needed

// Deduct User Balance
router.post("/deduct", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid userId or amount",
      });
    }

    const user = await User.findOne({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // REAL MODE
    if (user.mode === true) {
      if (Number(user.balance) < amount) {
        return res.status(400).json({
          message: "Insufficient real balance",
        });
      }

      user.balance = Number(user.balance) - Number(amount);
      await user.save();

      return res.status(200).json({
        message: "Deduction successful (Real mode)",
        mode: true,
        newBalance: user.balance,
      });
    }

    // DEMO MODE
    if (user.mode === false) {
      if (Number(user.demoBalance) < amount) {
        return res.status(400).json({
          message: "Insufficient demo balance",
        });
      }

      user.demoBalance = Number(user.demoBalance) - Number(amount);
      await user.save();

      return res.status(200).json({
        message: "Deduction successful (Demo mode)",
        mode: false,
        newBalance: user.demoBalance,
      });
    }

    return res.status(400).json({
      message: "Invalid mode",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


router.post("/demo-deduct", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid userId or amount",
      });
    }

    const user = await User.findOne({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (Number(user.demoBalance) < amount) {
      return res.status(400).json({
        message: "Insufficient demo balance",
      });
    }

    user.demoBalance = Number(user.demoBalance) - Number(amount);
    await user.save();

    return res.status(200).json({
      message: "Demo deduction successful",
      newBalance: user.demoBalance,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});


router.get("/:userId/balance", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { userId: req.params.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    user.mode = true;
    await user.save();

    res.json({
      balance: user.balance,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error.",
    });
  }
});


// Get User demoBalance
router.get("/:userId/demobalance", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { userId: req.params.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    user.mode = false;
    await user.save();

    res.json({
      demoBalance: user.demoBalance,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error.",
    });
  }
});
// =======================================
// RESET DEMO BALANCE
// =======================================
router.patch("/:userId/reset-demo", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { userId: req.params.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    user.demoBalance = 1000;
    await user.save();

    res.json({
      message: "Demo balance reset to ₦1000",
      demoBalance: user.demoBalance,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get Member Details
router.get("/:memberId/details", async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findOne({ where: { memberId } });
    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    res.status(200).json({
      memberId: member.memberId,
      shareBalance: member.shareBalance,
      contributedShare: member.contributedShare,
      sharePercentage: member.sharePercentage,
    });
  } catch (error) {
    console.error("Error fetching member details:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
