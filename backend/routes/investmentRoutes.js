const express = require('express');
require('dotenv').config();
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Sequelize, Op } = require('sequelize'); // ✅ combine them here once
const sequelize = require("../db");
const InvestmentSelection = require('../models/InvestmentSelection');
const Investment = require('../models/Investment');
const DemoInvestment = require("../models/DemoInvestment");
const GroupedInvestment = require('../models/GroupedInvestment');
const GroupedDemoInvestment = require('../models/GroupedDemoInvestment');
const InvestmentSelectionDemo = require("../models/InvestmentSelectionDemo");
const Odds = require('../models/Odds');
const CategoryOutcome = require('../models/CategoryOutcome');
const User = require('../models/User'); // Adjust if your path is different
const crypto = require('crypto');
const PlatformFee = require('../models/PlatformFee');

// ============================================================
// KEEP ONLY THE 100 NEWEST INVESTMENT SELECTIONS PER USER
// ============================================================

async function keepLatest100InvestmentSelections(
  Model,
  userId
) {

  const selections = await Model.findAll({

    where: {
      userId
    },

    order: [
      ["createdAt", "DESC"]
    ],

  });


  // ----------------------------------------------------------
  // Nothing to delete
  // ----------------------------------------------------------

  if (selections.length <= 100) {

    return;

  }


  // ----------------------------------------------------------
  // Everything after the newest 100 is old
  // ----------------------------------------------------------

  const oldSelections =
    selections.slice(100);


  console.log(
    `🗑️ ${oldSelections.length} old investment selections will be deleted for user ${userId}.`
  );


  // ----------------------------------------------------------
  // Delete oldest records
  // ----------------------------------------------------------

  for (const selection of oldSelections) {

    await Model.destroy({

      where: {
        investmentCode:
          selection.investmentCode
      }

    });

  }


  console.log(
    `✅ Kept latest 100 investment selections for user ${userId}.`
  );

}


// ======================================================
// UPDATE PLATFORM FEE AND REFERRAL BONUS
// ======================================================
async function processInvestmentPlatformFee(userId, amount) {
  try {
    // -----------------------------------------
    // Calculate 5% platform fee
    // -----------------------------------------
    const platformFeeAmount = Math.floor(Number(amount) * 0.05);

    if (platformFeeAmount <= 0) {
      console.log("Platform fee is 0. Nothing to process.");
      return;
    }

    // -----------------------------------------
    // Find the current user
    // -----------------------------------------
    const user = await User.findOne({
      where: { userId }
    });

    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    // -----------------------------------------
    // Check if user was referred
    // -----------------------------------------
    if (!user.referredBy) {

      // No referral
      // Entire 5% goes to PlatformFee
      const [platformFee] = await PlatformFee.findOrCreate({
        where: { type: "main" },
        defaults: {
          totalFees: 0
        }
      });

      platformFee.totalFees += platformFeeAmount;

      await platformFee.save();

      console.log(
        `✅ No referral. ₦${platformFeeAmount} added to PlatformFee.`
      );

      return;
    }

    // -----------------------------------------
    // User has a referrer
    // -----------------------------------------
    const referrer = await User.findOne({
      where: {
        referralCode: user.referredBy
      }
    });

    // -----------------------------------------
    // If referral code does not belong
    // to an existing user, send entire fee
    // to platform
    // -----------------------------------------
    if (!referrer) {

      console.warn(
        `⚠️ Referrer with referral code ${user.referredBy} not found.`
      );

      const [platformFee] = await PlatformFee.findOrCreate({
        where: { type: "main" },
        defaults: {
          totalFees: 0
        }
      });

      platformFee.totalFees += platformFeeAmount;

      await platformFee.save();

      console.log(
        `✅ Full ₦${platformFeeAmount} added to PlatformFee because referrer was not found.`
      );

      return;
    }

    // -----------------------------------------
    // Calculate referral bonus
    // 1/5 of the 5% platform fee
    // -----------------------------------------
    const referralBonus = Math.round(platformFeeAmount / 5);

    // -----------------------------------------
    // Platform receives the remaining 4/5
    // -----------------------------------------
    const platformAmount = platformFeeAmount - referralBonus;

    // -----------------------------------------
    // Add referral bonus to referrer's balance
    // -----------------------------------------
    referrer.balance = Number(referrer.balance || 0) + referralBonus;

    await referrer.save();

    // -----------------------------------------
    // Add remaining 4/5 to PlatformFee
    // -----------------------------------------
    const [platformFee] = await PlatformFee.findOrCreate({
      where: { type: "main" },
      defaults: {
        totalFees: 0
      }
    });

    platformFee.totalFees =
      Number(platformFee.totalFees || 0) + platformAmount;

    await platformFee.save();

    console.log(
      `✅ Referral bonus: ₦${referralBonus} paid to ${referrer.userId}`
    );

    console.log(
      `✅ Platform fee: ₦${platformAmount} added to PlatformFee`
    );

  } catch (error) {

    console.error(
      "❌ Error processing platform fee and referral:",
      error
    );

    throw error;
  }
}

router.get("/trend-data", async (req, res) => {

  try {

    // ========================================================
    // GET DISTINCT CATEGORY NAMES
    // ========================================================

    const categories =
      await CategoryOutcome.findAll({

        attributes: [

          [
            Sequelize.fn(
              "DISTINCT",
              Sequelize.col("category")
            ),

            "category"

          ]

        ],

        raw: true

      });


    const trends = {};


    // ========================================================
    // PROCESS EACH CATEGORY
    // ========================================================

    for (const item of categories) {

      const category =
        item.category;


      // ======================================================
      // STEP 1:
      // FIND ALL RECORDS AFTER THE MOST RECENT 100
      //
      // These are the records we no longer need.
      // ======================================================

      const oldRecords =
        await CategoryOutcome.findAll({

          where: {
            category
          },

          order: [
            ["timestamp", "DESC"]
          ],

          offset: 100,

          attributes: [
            "id"
          ],

          raw: true

        });


      // ======================================================
      // STEP 2:
      // DELETE RECORDS FROM 101 AND ABOVE
      // ======================================================

      if (oldRecords.length > 0) {

        const oldIds =
          oldRecords.map(
            record => record.id
          );


        await CategoryOutcome.destroy({

          where: {

            id: {

              [Op.in]:
                oldIds

            }

          }

        });


        console.log(

          `🗑️ Deleted ${oldIds.length} old trend record(s) from ${category}.`

        );

      }


      // ======================================================
      // STEP 3:
      // FETCH THE REMAINING LATEST 100 RECORDS
      // ======================================================

      const rows =
        await CategoryOutcome.findAll({

          where: {
            category
          },

          order: [
            ["timestamp", "DESC"]
          ],

          limit: 100,

          raw: true

        });


      // Reverse so frontend receives:
      //
      // Oldest → Newest
      //

      rows.reverse();


      // ======================================================
      // STEP 4:
      // BUILD TREND DATA
      // ======================================================

      trends[category] = {

        outcomes:

          rows.map(r => ({

            outcome:
              r.outcome,

            timestamp:
              r.timestamp

          })),

        meanROI:

          rows.length

            ? Number(
                Number(
                  rows[
                    rows.length - 1
                  ].meanROI || 0
                ).toFixed(2)
              )

            : 0,


        maxEROI:

          rows.length

            ? Number(
                Number(
                  rows[
                    rows.length - 1
                  ].maxEROI || 0
                ).toFixed(2)
              )

            : 0

      };

    }


    // ========================================================
    // RETURN DATA
    // ========================================================

    return res.json({

      success: true,

      trends

    });


  } catch (err) {

    console.error(
      "Trend data error:",
      err
    );


    return res.status(500).json({

      success: false,

      message: "Server Error"

    });

  }

});

// GET: Odds for all categories
router.get('/odds', async (req, res) => {
  try {
    const oddsData = await Odds.findAll({
      attributes: ['category', 'demandOdds', 'supplyOdds'],
      raw: true,
    });

    if (!oddsData.length) {
      return res.status(404).json({ success: false, message: 'No odds data available' });
    }

    const oddsMap = {};
    oddsData.forEach((entry) => {
      oddsMap[entry.category] = {
        demand: Math.round(entry.demandOdds ?? 0),
        supply: Math.round(entry.supplyOdds ?? 0),
      };
    });

    res.json({ success: true, odds: oddsMap });
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ============================================================
// GET: Investment Receipts
// ============================================================
// RULE:
// - Each user can have a maximum of 50 receipts.
// - If there are more than 50, delete the oldest ones.
// - Receipts are returned 30 per page.
// ============================================================

router.get('/receipt', async (req, res) => {

  try {

    const {
      userId,
      page = 1,
      limit = 30
    } = req.query;


    // ========================================================
    // VALIDATE USER ID
    // ========================================================

    if (!userId) {

      return res.status(400).json({
        error: 'User ID is required'
      });

    }


    // ========================================================
    // PAGINATION VALUES
    // ========================================================

    const currentPage =
      Math.max(
        parseInt(page, 10) || 1,
        1
      );

    // We want maximum 30 per page.
    const pageSize = 30;

    const offset =
      (currentPage - 1) * pageSize;


    // ========================================================
    // STEP 1
    // COUNT ALL RECEIPTS FOR THIS USER
    // ========================================================

    const totalReceipts =
      await GroupedInvestment.count({

        where: {
          userId
        }

      });


    console.log(
      `User ${userId} has ${totalReceipts} receipt(s).`
    );


    // ========================================================
    // STEP 2
    // IF MORE THAN 50, DELETE THE OLDEST RECEIPTS
    // ========================================================

    if (totalReceipts > 50) {

      const numberToDelete =
        totalReceipts - 50;


      console.log(
        `⚠️ User ${userId} has more than 50 receipts.`
      );

      console.log(
        `Deleting ${numberToDelete} oldest receipt(s)...`
      );


      // ------------------------------------------------------
      // Find the oldest receipts
      // ------------------------------------------------------

      const oldestReceipts =
        await GroupedInvestment.findAll({

          where: {
            userId
          },

          order: [
            ['createdAt', 'ASC']
          ],

          limit: numberToDelete,

          attributes: [
            'groupCode'
          ]

        });


      // ------------------------------------------------------
      // Delete them
      // ------------------------------------------------------

      if (oldestReceipts.length > 0) {

        const oldestGroupCodes =
          oldestReceipts.map(
            receipt => receipt.groupCode
          );


        await GroupedInvestment.destroy({

          where: {

            userId,

            groupCode: {
              [Op.in]: oldestGroupCodes
            }

          }

        });


        console.log(
          `✅ Deleted ${oldestReceipts.length} oldest receipt(s) for user ${userId}.`
        );

      }

    }


    // ========================================================
    // STEP 3
    // COUNT RECEIPTS AGAIN
    // ========================================================

    const finalTotalReceipts =
      await GroupedInvestment.count({

        where: {
          userId
        }

      });


    // ========================================================
    // STEP 4
    // IF NO RECEIPTS REMAIN
    // ========================================================

    if (finalTotalReceipts === 0) {

      return res.status(404).json({

        message:
          'No investments found for this user',

        investments: [],

        total: 0,

        page: currentPage,

        limit: pageSize,

        totalPages: 0

      });

    }


    // ========================================================
    // STEP 5
    // CALCULATE TOTAL PAGES
    // ========================================================

    const totalPages =
      Math.ceil(
        finalTotalReceipts / pageSize
      );


    // ========================================================
    // STEP 6
    // IF REQUESTED PAGE DOES NOT EXIST
    // ========================================================

    if (
      currentPage > totalPages
    ) {

      return res.status(200).json({

        investments: [],

        total:
          finalTotalReceipts,

        page:
          currentPage,

        limit:
          pageSize,

        totalPages

      });

    }


    // ========================================================
    // STEP 7
    // FETCH ONLY THE CURRENT PAGE
    // ========================================================

    const investments =
      await GroupedInvestment.findAll({

        where: {
          userId
        },

        order: [
          ['createdAt', 'DESC']
        ],

        limit:
          pageSize,

        offset

      });


    // ========================================================
    // STEP 8
    // RETURN PAGINATED DATA
    // ========================================================

    return res.status(200).json({

      investments,

      total:
        finalTotalReceipts,

      page:
        currentPage,

      limit:
        pageSize,

      totalPages

    });


  } catch (error) {

    console.error(
      'Error fetching investment receipts:',
      error
    );


    return res.status(500).json({

      error:
        'Server error',

      details:
        error.message

    });

  }

});


// =======================
// DEMO RECEIPT
// =======================
// ============================================================
// DEMO RECEIPT
// ============================================================

router.get("/demoreceipt", async (req, res) => {

  try {

    const {
      userId,
      page = 1,
      limit = 30
    } = req.query;


    // ========================================================
    // VALIDATE USER ID
    // ========================================================

    if (!userId) {

      return res.status(400).json({
        error: "User ID is required"
      });

    }


    // ========================================================
    // PAGINATION VALUES
    // ========================================================

    const currentPage =
      Math.max(
        parseInt(page, 10) || 1,
        1
      );

    // Maximum 30 receipts per page
    const pageSize = 30;

    const offset =
      (currentPage - 1) * pageSize;


    // ========================================================
    // STEP 1
    // COUNT ALL DEMO RECEIPTS FOR THIS USER
    // ========================================================

    const totalReceipts =
      await GroupedDemoInvestment.count({

        where: {
          userId
        }

      });


    console.log(
      `User ${userId} has ${totalReceipts} demo receipt(s).`
    );


    // ========================================================
    // STEP 2
    // IF MORE THAN 50, DELETE THE OLDEST
    // ========================================================

    if (totalReceipts > 50) {

      const numberToDelete =
        totalReceipts - 50;


      console.log(
        `⚠️ User ${userId} has more than 50 demo receipts.`
      );

      console.log(
        `Deleting ${numberToDelete} oldest demo receipt(s)...`
      );


      // ------------------------------------------------------
      // FIND OLDEST DEMO RECEIPTS
      // ------------------------------------------------------

      const oldestReceipts =
        await GroupedDemoInvestment.findAll({

          where: {
            userId
          },

          order: [
            ["createdAt", "ASC"]
          ],

          limit: numberToDelete,

          attributes: [
            "groupCode"
          ]

        });


      // ------------------------------------------------------
      // DELETE THEM
      // ------------------------------------------------------

      if (oldestReceipts.length > 0) {

        const oldestGroupCodes =
          oldestReceipts.map(
            receipt => receipt.groupCode
          );


        await GroupedDemoInvestment.destroy({

          where: {

            userId,

            groupCode: {
              [Op.in]: oldestGroupCodes
            }

          }

        });


        console.log(
          `✅ Deleted ${oldestReceipts.length} oldest demo receipt(s) for user ${userId}.`
        );

      }

    }


    // ========================================================
    // STEP 3
    // COUNT DEMO RECEIPTS AGAIN
    // ========================================================

    const finalTotalReceipts =
      await GroupedDemoInvestment.count({

        where: {
          userId
        }

      });


    // ========================================================
    // STEP 4
    // IF NO DEMO RECEIPTS REMAIN
    // ========================================================

    if (finalTotalReceipts === 0) {

      return res.status(404).json({

        message:
          "No demo investments found for this user",

        investments: [],

        total: 0,

        page:
          currentPage,

        limit:
          pageSize,

        totalPages: 0

      });

    }


    // ========================================================
    // STEP 5
    // CALCULATE TOTAL PAGES
    // ========================================================

    const totalPages =
      Math.ceil(
        finalTotalReceipts / pageSize
      );


    // ========================================================
    // STEP 6
    // IF REQUESTED PAGE DOES NOT EXIST
    // ========================================================

    if (
      currentPage > totalPages
    ) {

      return res.status(200).json({

        investments: [],

        total:
          finalTotalReceipts,

        page:
          currentPage,

        limit:
          pageSize,

        totalPages

      });

    }


    // ========================================================
    // STEP 7
    // FETCH CURRENT PAGE
    // ========================================================

    const investments =
      await GroupedDemoInvestment.findAll({

        where: {
          userId
        },

        order: [
          ["createdAt", "DESC"]
        ],

        limit:
          pageSize,

        offset

      });


    // ========================================================
    // STEP 8
    // RETURN PAGINATED DEMO RECEIPTS
    // ========================================================

    return res.status(200).json({

      investments,

      total:
        finalTotalReceipts,

      page:
        currentPage,

      limit:
        pageSize,

      totalPages

    });


  } catch (error) {

    console.error(
      "Error fetching demo investment receipts:",
      error
    );


    return res.status(500).json({

      error:
        "Server error",

      details:
        error.message

    });

  }

});

// ============================================================
// DEMO INVESTMENT SELECTION
// MAXIMUM 100 RECORDS PER USER
// ============================================================

async function submitInvestmentSelectionDemo(
  userId,
  amount,
  timeframe,
  selectedInvestments
) {

  try {

    const investmentCode = uuidv4();


    // ========================================================
    // SAVE NEW INVESTMENT SELECTION
    // ========================================================

    await InvestmentSelectionDemo.create({

      investmentCode,

      userId,

      amount,

      timeframe,

      status: "awaiting",

      outcome: "active",

      selectedInvestments,

      synchronized: false,

      distributed: false

    });


    // ========================================================
    // KEEP ONLY THE LATEST 100 FOR THIS USER
    // ========================================================

    await keepLatest100InvestmentSelections(
      InvestmentSelectionDemo,
      userId
    );


    return {

      success: true,

      message:
        "Investment saved successfully",

      investmentCode

    };

  } catch (error) {

    console.error(
      "❌ Demo investment submission error:",
      error
    );


    return {

      success: false,

      message: error.message

    };

  }

}


// ============================================================
// SUBMIT REAL INVESTMENT SELECTION
// MAXIMUM 100 RECORDS PER USER
// ============================================================

router.post(
  "/submit-investmentselection",
  async (req, res) => {

    try {

      const {
        userId,
        amount,
        timeframe,
        selectedInvestments
      } = req.body;


      // ======================================================
      // VALIDATE INPUT
      // ======================================================

      if (
        !userId ||
        !amount ||
        !timeframe ||
        !Array.isArray(selectedInvestments)
      ) {

        return res.status(400).json({

          message:
            "Invalid input data"

        });

      }


      // ======================================================
      // FIND USER
      // ======================================================

      const user =
        await User.findOne({

          where: {
            userId
          }

        });


      if (!user) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }


      // ======================================================
      // DEMO MODE
      // ======================================================

      if (user.mode === false) {

        const result =
          await submitInvestmentSelectionDemo(

            userId,

            amount,

            timeframe,

            selectedInvestments

          );


        return res.status(201).json(
          result
        );

      }


      // ======================================================
      // REAL MODE
      // ======================================================

      const investmentCode =
        uuidv4();


      console.log(
        JSON.stringify(
          selectedInvestments,
          null,
          2
        )
      );


      // ======================================================
      // SAVE INVESTMENT
      // ======================================================

      await InvestmentSelection.create({

        investmentCode,

        userId,

        amount,

        timeframe,

        outcome: "active",

        status: "awaiting",

        selectedInvestments,

        synchronized: false,

        distributed: false

      });


      // ======================================================
      // KEEP ONLY THE LATEST 100
      // ======================================================

      await keepLatest100InvestmentSelections(

        InvestmentSelection,

        userId

      );


      // ======================================================
      // PROCESS PLATFORM FEE
      // ======================================================

      await processInvestmentPlatformFee(
        userId,
        amount
      );


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(201).json({

        message:
          "Investment saved successfully",

        investmentCode

      });


    } catch (error) {

      console.error(
        "❌ Investment submission error:",
        error
      );


      return res.status(500).json({

        message:
          "Server error",

        error:
          error.message

      });

    }

  }
);

// ============================================================
// SUBMIT DEMO INVESTMENT SELECTION
// MAXIMUM 100 RECORDS PER USER
// ============================================================

router.post(
  "/submit-demoinvestmentselection",
  async (req, res) => {

    try {

      const {
        userId,
        amount,
        timeframe,
        selectedInvestments
      } = req.body;


      // ======================================================
      // VALIDATE INPUT
      // ======================================================

      if (
        !userId ||
        !amount ||
        !timeframe ||
        !Array.isArray(selectedInvestments)
      ) {

        return res.status(400).json({

          message:
            "Invalid input data"

        });

      }


      // ======================================================
      // CREATE INVESTMENT
      // ======================================================

      const investmentCode =
        uuidv4();


      await InvestmentSelectionDemo.create({

        investmentCode,

        userId,

        amount,

        timeframe,

        status: "awaiting",

        outcome: "active",

        selectedInvestments,

        synchronized: false,

        distributed: false

      });


      // ======================================================
      // KEEP ONLY THE LATEST 100
      // ======================================================

      await keepLatest100InvestmentSelections(

        InvestmentSelectionDemo,

        userId

      );


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(201).json({

        success: true,

        message:
          "Investment saved successfully",

        investmentCode

      });


    } catch (error) {

      console.error(
        "❌ Demo investment submission error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  }
);


// ============================================================
// SUBMIT AUTO INVESTMENT SELECTION
// MAXIMUM 100 RECORDS PER USER
// ============================================================

router.post(
  "/submit-investmentselectionauto",
  async (req, res) => {

    try {

      const {
        userId,
        amount,
        timeframe,
        selectedInvestments
      } = req.body;


      // ======================================================
      // VALIDATE INPUT
      // ======================================================

      if (
        !userId ||
        !amount ||
        !timeframe ||
        !Array.isArray(selectedInvestments)
      ) {

        return res.status(400).json({

          message:
            "Invalid input data"

        });

      }


      // ======================================================
      // FIND USER
      // ======================================================

      const user =
        await User.findOne({

          where: {
            userId
          }

        });


      if (!user) {

        return res.status(404).json({

          message:
            "User not found"

        });

      }


      // ======================================================
      // CREATE INVESTMENT
      // ======================================================

      const investmentCode =
        uuidv4();


      console.log(
        JSON.stringify(
          selectedInvestments,
          null,
          2
        )
      );


      await InvestmentSelection.create({

        investmentCode,

        userId,

        amount,

        timeframe,

        status: "awaiting",

        outcome: "active",

        selectedInvestments,

        synchronized: false,

        distributed: false

      });


      // ======================================================
      // KEEP ONLY THE LATEST 100
      // ======================================================

      await keepLatest100InvestmentSelections(

        InvestmentSelection,

        userId

      );


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(201).json({

        message:
          "Investment saved successfully",

        investmentCode

      });


    } catch (error) {

      console.error(
        "❌ Auto investment submission error:",
        error
      );


      return res.status(500).json({

        message:
          "Server error",

        error:
          error.message

      });

    }

  }
);



// GET: Retrieve investment by code
router.get('/investment/:investmentCode', async (req, res) => {
  try {
    const investment = await InvestmentSelection.findOne({
      where: { investmentCode: req.params.investmentCode },
    });

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    res.status(200).json(investment);
  } catch (error) {
    console.error('Error retrieving investment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// =======================================
// SAVE DEMO INVESTMENTS
// =======================================

async function submitInvestmentsDemo(investments) {

  const userId = investments[0]?.userId;

  const user = await User.findOne({
    where: { userId }
  });

  if (!user) {
    return {
      success: false,
      status: 403,
      message: "User not authorized"
    };
  }

  const transaction = await sequelize.transaction();

  try {

    // =======================================
    // DELETE ONLY COMPLETED INVESTMENTS
    // FOR THIS USER
    // =======================================

    await DemoInvestment.destroy({

      where: {
        userId,
        status: "completed"
      },

      transaction

    });


    // =======================================
    // SAVE NEW INVESTMENTS
    // =======================================

    await DemoInvestment.bulkCreate(

      investments.map(inv => ({

        userId: inv.userId,
        category: inv.category,
        choice: inv.choice,
        amount: inv.amount,
        timeframe: inv.timeframe,
        odds: inv.odds,
        roi: inv.roi,
        status: inv.status,
        outcome: inv.outcome,
        investmentCode: inv.investmentCode

      })),

      {
        transaction
      }

    );


    await transaction.commit();


    return {
      success: true,
      status: 201,
      message: "Investments successfully saved"
    };


  } catch (err) {

    await transaction.rollback();

    throw err;

  }

}

// =======================================
// SUBMIT INVESTMENTS
// =======================================

router.post("/submit-investment", async (req, res) => {

  try {

    const { investments } = req.body;

    if (
      !Array.isArray(investments) ||
      investments.length === 0
    ) {

      return res.status(400).json({
        message: "Invalid investments data"
      });

    }

    const userId = investments[0].userId;

    const user = await User.findOne({
      where: { userId }
    });

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });

    }


    // ==========================
    // DEMO MODE
    // ==========================

    if (user.mode === false) {

      const result =
        await submitInvestmentsDemo(investments);

      return res
        .status(result.status)
        .json(result);

    }


    // ==========================
    // REAL MODE
    // ==========================

    const transaction =
      await sequelize.transaction();

    try {

      // =======================================
      // DELETE ONLY COMPLETED INVESTMENTS
      // FOR THIS USER
      // =======================================

      await Investment.destroy({

        where: {
          userId,
          status: "completed"
        },

        transaction

      });


      // =======================================
      // SAVE NEW INVESTMENTS
      // =======================================

      const savedInvestments =
        await Investment.bulkCreate(

          investments.map(inv => ({

            userId: inv.userId,
            category: inv.category,
            choice: inv.choice,
            amount: inv.amount,
            timeframe: inv.timeframe,
            odds: inv.odds,
            roi: inv.roi,
            status: inv.status,
            outcome: inv.outcome,
            investmentCode: inv.investmentCode

          })),

          {
            transaction
          }

        );


      await transaction.commit();


      return res.status(201).json({

        message:
          "Investments successfully saved",

        savedInvestments

      });


    } catch (err) {

      await transaction.rollback();

      throw err;

    }


  } catch (err) {

    console.error(err);

    return res.status(500).json({

      message: err.message

    });

  }

});


router.get("/demouser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const investments = await InvestmentSelectionDemo.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 70,
    });

    res.status(200).json(investments);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
});


router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const investments = await InvestmentSelection.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 70,
    });

    res.status(200).json(investments);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// Endpoint: Generate or Fetch Referral Link
router.post('/generate-referral', async (req, res) => {
  try {
    const { userId } = req.body; // The user's unique ID

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find the user
    const user = await User.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If referralCode already exists, return it
    if (user.referralCode) {
      return res.status(200).json({ referralLink: `${process.env.FRONTEND_URL}/#/signup?ref=${user.referralCode}` });
    }

    // Otherwise, generate a new referralCode
    const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Example: 'A1B2C3'
    const referralCode = `QS9JA-${randomCode}`;

    // Save the referral code to user
    user.referralCode = referralCode;
    await user.save();

    return res.status(201).json({ referralLink: `${process.env.FRONTEND_URL}/#/signup?ref=${referralCode}` });

  } catch (error) {
    console.error('Error generating referral link:', error);
    return res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;
