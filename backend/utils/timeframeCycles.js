const axios = require('axios');
require('dotenv').config();
const Investment = require('../models/Investment');
const InvestmentSelection = require('../models/InvestmentSelection');
const InvestmentSelectionDemo = require('../models/InvestmentSelectionDemo');
const User = require('../models/User'); // Import the User model
const cron = require('node-cron');
const Odds = require('../models/Odds'); // Import the Odds schema
const { v4: uuidv4 } = require('uuid');


// Function to trigger outcome processing
const triggerOutcomeProcessing = async () => {
  console.log("⏳ Checking for completed investments...");

  try {
    const completedInvestmentsCount = await Investment.count({
      where: { status: 'completed', outcome: null }
    });

    if (completedInvestmentsCount > 0) {
      console.log("📡 Triggering /process endpoint...");
      try {
        await axios.get(`${process.env.BASE_URL}/api/outcomes/process`);
        console.log("✅ Outcome processing triggered successfully.");
      } catch (error) {
        console.error("❌ Error calling /process endpoint:", error.message);
      }
    } else {
      console.log("🚫 No completed investments to process. Skipping.");
    }
  } catch (error) {
    console.error("❌ Error checking investments:", error.message);
  }
};



async function updateOdds() {
  try {
    // Fetch investments where status is 'active' or 'awaiting'
    const investments = await Investment.findAll({
      where: {
        status: ['active', 'awaiting'],
      },
    });

    if (investments.length === 0) {
      console.log('No active or awaiting investments found.');
      return;
    }

    // Group investments by category and choice
    const categoryCounts = {};

    investments.forEach((investment) => {
      const { category, choice } = investment;

      if (!categoryCounts[category]) {
        categoryCounts[category] = { supply: 0, demand: 0 };
      }

      if (choice === 'Supply') {
        categoryCounts[category].supply += 1;
      } else if (choice === 'Demand') {
        categoryCounts[category].demand += 1;
      }
    });

    // Update the odds for each category
    for (const category in categoryCounts) {
      const { supply, demand } = categoryCounts[category];
      const total = supply + demand;

      const supplyOdds = total === 0 ? 0 : (supply / total) * 100;
      const demandOdds = total === 0 ? 0 : (demand / total) * 100;

      // Upsert into Odds table
      const [odds, created] = await Odds.findOrCreate({
        where: { category },
        defaults: {
          supplyOdds,
          demandOdds,
          updatedAt: new Date(),
        },
      });

      if (!created) {
        // If already exists, update
        odds.supplyOdds = supplyOdds;
        odds.demandOdds = demandOdds;
        odds.updatedAt = new Date();
        await odds.save();
      }

      console.log(
        `Odds updated for category "${category}": Supply ${supplyOdds.toFixed(2)}%, Demand ${demandOdds.toFixed(2)}%`
      );
    }
  } catch (error) {
    console.error('❌ Error updating odds:', error.message);
  }
}



// 1. Set Investments to "active"
async function updateInvestmentStatusToActive() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'active', updatedAt: new Date() },
      {
        where: {
          status: 'awaiting',
        },
      }
    );
    console.log(`${affectedRows} investments set to active.`);
  } catch (error) {
    console.error(`Error updating investments to active: ${error.message}`);
  }
  
}

// 2. Set Investments to "completed"
async function updateInvestmentStatusToCompleted5() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '5m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}
async function updateInvestmentStatusToCompleted15() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '15m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}
async function updateInvestmentStatusToCompleted30() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '30m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}
async function updateInvestmentStatusToCompleted1h() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}
async function updateInvestmentStatusToCompleted4h() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '4h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}
async function updateInvestmentStatusToCompleted1d() {
  try {
    const [affectedRows] = await Investment.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1d',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investments set to completed.`);
  } catch (error) {
    console.error(`Error updating investments to completed: ${error.message}`);
  }
}

// 3. Set InvestmentSelections to "active"
async function updateInvestmentSelectionStatusToActive() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'active', updatedAt: new Date() },
      {
        where: {
          
          status: 'awaiting',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to active.`);
  } catch (error) {
    console.error(`Error updating investment selections to active: ${error.message}`);
  }
}


// 3. Set DemoInvestmentSelections to "active"
async function updateDemoInvestmentSelectionStatusToActive() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'active', updatedAt: new Date() },
      {
        where: {
          
          status: 'awaiting',
        },
      }
    );
    console.log(`${affectedRows} Demoinvestment selections set to active.`);
  } catch (error) {
    console.error(`Error updating Demoinvestment selections to active: ${error.message}`);
  }
}

// 4. Set InvestmentSelections to "completed"
async function updateInvestmentSelectionStatusToCompleted5() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '5m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

// 4. Set DemoInvestmentSelections to "completed"
async function DemoupdateInvestmentSelectionStatusToCompleted5() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '5m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}

async function updateInvestmentSelectionStatusToCompleted15() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '15m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

async function DemoupdateInvestmentSelectionStatusToCompleted15() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '15m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}

async function updateInvestmentSelectionStatusToCompleted30() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '30m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

async function DemoupdateInvestmentSelectionStatusToCompleted30() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '30m',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}

async function updateInvestmentSelectionStatusToCompleted1h() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

async function DemoupdateInvestmentSelectionStatusToCompleted1h() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}

async function updateInvestmentSelectionStatusToCompleted4h() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '4h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

async function DemoupdateInvestmentSelectionStatusToCompleted4h() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '4h',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}

async function updateInvestmentSelectionStatusToCompleted1d() {
  try {
    const [affectedRows] = await InvestmentSelection.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1d',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} investment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating investment selections to completed: ${error.message}`);
  }
}

async function DemoupdateInvestmentSelectionStatusToCompleted1d() {
  try {
    const [affectedRows] = await InvestmentSelectionDemo.update(
      { status: 'completed', updatedAt: new Date() },
      {
        where: {
          timeframe: '1d',
          status: 'active',
        },
      }
    );
    console.log(`${affectedRows} demoinvestment selections set to completed.`);
  } catch (error) {
    console.error(`Error updating demoinvestment selections to completed: ${error.message}`);
  }
}


const AUTO_USER_ID = 'QS9-1787589138217-122'; // Replace this with actual userId
const TIMEFRAME = '5m';
let usedCategories = [];

// Set individual amounts for each of the 10 selections
const INVESTMENT_AMOUNTS = [
  300, // higher odds
  500, // lower odds
  700, // random group 1
  750, // random group 2
  730, // random group 3
  790, // random group 4
  350, // random group 5
  650, // random group 6
  800, // random group 7
  600, // random group 8
];


// Function to generate a unique investment code
function generateUniqueCode() {
    return 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function getOdds() {
  try {
    const odds = await Odds.findAll();
    return odds.map(o => ({
      category: o.category,
      supplyOdds: Math.round(o.supplyOdds),
      demandOdds: Math.round(o.demandOdds)
    }));
  } catch (err) {
    console.error('Error fetching odds from DB:', err.message);
    throw err;
  }
}

// Function to submit individual investments
async function submitInvestments(
  userId,
  investmentCode,
  selectedInvestments,
  amount
) {
  try {

    console.log(
      `📤 Submitting ${selectedInvestments.length} investments under investmentCode: ${investmentCode}`
    );

    // ==========================================================
    // NET INVESTMENT AFTER 5% PLATFORM FEE
    // ==========================================================

    const netAmount = Number(
      (amount * 0.95).toFixed(2)
    );


    // ==========================================================
    // NUMBER OF SELECTED INVESTMENTS
    // ==========================================================

    const numberOfInvestments =
      selectedInvestments.length;


    if (numberOfInvestments === 0) {

      throw new Error(
        "No investments were selected."
      );

    }


    // ==========================================================
    // NET AMOUNT ALLOCATED TO EACH INVESTMENT
    // ==========================================================

    const amountPerInvestment =
      Number(
        (
          netAmount /
          numberOfInvestments
        ).toFixed(2)
      );


    // ==========================================================
    // CREATE INVESTMENTS
    // ==========================================================

    const investments =
      selectedInvestments.map(
        investment => {

          // ----------------------------------------------------
          // NEW ROI CALCULATION
          //
          // ROI =
          // amount allocated to this investment
          //
          // +
          //
          // odds-based return
          // ----------------------------------------------------

          const roi =
            Number(
              (
                amountPerInvestment +
                (
                  netAmount *
                  (
                    investment.odds /
                    100
                  )
                )
              ).toFixed(2)
            );


          return {

            userId,

            category:
              investment.category,

            choice:
              investment.choice,

            // Original amount invested
            amount,

            timeframe:
              TIMEFRAME,

            // New ROI
            roi,

            odds:
              investment.odds,

            status:
              "awaiting",

            outcome:
              null,

            investmentCode,

          };

        }
      );


    // ==========================================================
    // LOG PAYLOAD
    // ==========================================================

    console.log(
      "📦 Investments payload:",
      JSON.stringify(
        investments,
        null,
        2
      )
    );


    // ==========================================================
    // SUBMIT TO BACKEND
    // ==========================================================

    const response =
      await axios.post(
        `${process.env.BASE_URL}/api/investments/submit-investment`,
        {
          investments
        }
      );


    console.log(
      "✅ Investments successfully submitted:",
      response.data
    );


    return response.data;


  } catch (error) {

    console.error(
      "❌ Error submitting investments:",
      error.response?.data ||
      error.message
    );

    throw error;

  }
}

// Function to deduct amount
async function deductAmount(userId, amount) {
  try {
    const response = await axios.post(`${process.env.BASE_URL}/api/balance/deduct`, {
      userId,
      amount,
    });
    console.log('✅ Amount deducted successfully.');
    return response.data;
  } catch (error) {
    console.error('❌ Error deducting Amount:', error.response?.data || error.message);
    return null;
  }
}

// Function to deduct amount
async function deductDemoAmount(userId, amount) {
  try {
    const response = await axios.post(`${process.env.BASE_URL}/api/balance/demo-deduct`, {
      userId,
      amount,
    });
    console.log('✅ demoAmount deducted successfully.');
    return response.data;
  } catch (error) {
    console.error('❌ Error deducting Amount:', error.response?.data || error.message);
    return null;
  }
}




function getHigherOddsSelection(oddsList) {
  return oddsList.map(o => {
    const selectedOdds = Math.max(o.supplyOdds, o.demandOdds);
    const choice = selectedOdds === o.supplyOdds ? 'Supply' : 'Demand'; // Mark the choice
    return {
      category: o.category,
      odds: selectedOdds,
      choice: choice,  // Indicating which choice (Supply/Demand)
    };
  });
}

function getLowerOddsSelection2(oddsList) {
  return oddsList.map(o => {
    const selectedOdds = Math.min(o.supplyOdds, o.demandOdds);
    const choice = selectedOdds === o.supplyOdds ? 'Supply' : 'Demand'; // Mark the choice
    return {
      category: o.category,
      odds: selectedOdds,
      choice: choice,  // Indicating which choice (Supply/Demand)
    };
  });
}


function getLowerOddsSelection(oddsList, higherSelection) {
  return oddsList.map((o, index) => {
    const higherChoice = higherSelection[index].choice;
    const lowerChoice = higherChoice === 'Supply' ? 'Demand' : 'Supply';
    const selectedOdds = lowerChoice === 'Supply' ? o.supplyOdds : o.demandOdds;

    return {
      category: o.category,
      odds: selectedOdds,
      choice: lowerChoice,
    };
  });
}


function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function get8RandomGroupsOf3(oddsList) {
  const allCategories = oddsList.map(o => o.category);

  if (usedCategories.length >= 24) {
    console.log('Resetting used categories');
    usedCategories = [];
  }

  const remaining = allCategories.filter(cat => !usedCategories.includes(cat));

  const categoriesToUse = remaining.length >= 24
    ? shuffleArray(remaining).slice(0, 24)
    : shuffleArray([...remaining, ...shuffleArray(usedCategories)]).slice(0, 24);

  const groups = [];
  for (let i = 0; i < 8; i++) {
    const group = categoriesToUse.slice(i * 3, i * 3 + 3);
    groups.push(group);
  }

  usedCategories.push(...categoriesToUse);

  return groups.map(group => {
    return group.map(cat => {
      const match = oddsList.find(o => o.category === cat);
      const odds = Math.random() < 0.5 ? match.supplyOdds : match.demandOdds;
      const choice = odds === match.supplyOdds ? 'Supply' : 'Demand'; // Determine the choice based on odds
      return { category: cat, odds, choice }; // Ensure choice is included
    });
  });
}

// Function to submit an investment selection
async function submitInvestmentSelection(userId, selectedInvestments, amount) {

  try {

    console.log("📝 Submitting investment selection...");

    const investmentCode = generateUniqueCode();

    // Deduct first
    const deduction = await deductAmount(userId, amount);

    if (!deduction) {

      console.error("❌ Deduction failed, skipping investment.");

      return null;

    }

    //----------------------------------------------------
    // Build COMPLETE investment objects
    //----------------------------------------------------

    const netAmount = Number((amount * 0.95).toFixed(2));

    // Number of investments selected
    const numberOfInvestments = selectedInvestments.length;

    const formattedInvestments = selectedInvestments.map(investment => {

      // NEW ROI CALCULATION
      const roi = Number(
        (
          (netAmount / numberOfInvestments) +
          (netAmount * (investment.odds / 100))
        ).toFixed(2)
      );

      return {

        userId,

        category: investment.category,

        choice: investment.choice,

        amount: netAmount,

        roi,

        timeframe: TIMEFRAME,

        odds: investment.odds,

        status: "awaiting",

        outcome: null,

        investmentCode,

      };

    });

    //----------------------------------------------------
    // Save InvestmentSelection
    //----------------------------------------------------

    await axios.post(

      `${process.env.BASE_URL}/api/investments/submit-investmentselectionauto`,

      {

        investmentCode,

        userId,

        amount,

        timeframe: TIMEFRAME,

        selectedInvestments: formattedInvestments,

      },

      {

        timeout: 120000,

      }

    );

    //----------------------------------------------------
    // Save Investments
    //----------------------------------------------------

    await submitInvestments(

      userId,

      investmentCode,

      formattedInvestments,

      amount

    );

    //----------------------------------------------------
    // Give Bonus
    //----------------------------------------------------

    const bonusAmount = Math.floor(amount * 0.05);

    const user = await User.findOne({

      where: {

        userId,

      },

    });

    if (!user) {

      console.error("❌ User not found.");

      return null;

    }

    user.balance += bonusAmount;

    await user.save();

    console.log(`💰 Bonus of ₦${bonusAmount} added to user balance`);

    return investmentCode;

  } catch (error) {

    console.error(

      "❌ Error submitting investment selection:",

      error.response?.data || error.message

    );

    return null;

  }

}



// Function to submit an investment selection
async function submitDemoInvestmentSelection(userId, selectedInvestments, amount) {

  try {

    console.log("📝 Submitting investment selection...");

    const investmentCode = generateUniqueCode();

    // Deduct first
    const deduction = await deductDemoAmount(userId, amount);

    if (!deduction) {

      console.error("❌ Deduction failed, skipping investment.");

      return null;

    }

    //----------------------------------------------------
    // Build COMPLETE investment objects
    //----------------------------------------------------

    const netAmount = Number((amount * 0.95).toFixed(2));

    const formattedInvestments = selectedInvestments.map(investment => {

      const roi = Number(
        (netAmount + (netAmount * (investment.odds / 100))).toFixed(2)
      );

      return {

        userId,

        category: investment.category,

        choice: investment.choice,

        amount: netAmount,

        roi,

        timeframe: TIMEFRAME,

        odds: investment.odds,

        status: "awaiting",

        outcome: null,

        investmentCode,

      };

    });

    //----------------------------------------------------
    // Save InvestmentSelection
    //----------------------------------------------------

    await axios.post(

      `${process.env.BASE_URL}/api/investments/submit-demoinvestmentselection`,

      {

        investmentCode,

        userId,

        amount,

        timeframe: TIMEFRAME,

        selectedInvestments: formattedInvestments,

      },

      {

        timeout: 120000,

      }

    );

    //----------------------------------------------------
    // Give Bonus
    //----------------------------------------------------

    const bonusAmount = Math.floor(amount * 0.05);

    const user = await User.findOne({

      where: {

        userId,

      },

    });

    if (!user) {

      console.error("❌ User not found.");

      return null;

    }

    user.demoBalance += bonusAmount;

    await user.save();

    console.log(`💰 Bonus of ₦${bonusAmount} added to user balance`);

    return investmentCode;

  } catch (error) {

    console.error(

      "❌ Error submitting investment selection:",

      error.response?.data || error.message

    );

    return null;

  }

}



  
async function automatedInvestment() {
  console.log('\nRunning automated investment...');

  try {
    const user = await User.findOne({ where: { userId: AUTO_USER_ID } });
    if (!user) {
      console.error('Auto user not found.');
      return;
    }

    const totalRequired = INVESTMENT_AMOUNTS.reduce((a, b) => a + b, 0);
    if (user.balance < totalRequired) {
      console.error(`Insufficient balance. Needed: ₦${totalRequired}, Available: ₦${user.balance}`);
      return;
    }

    const oddsList = await getOdds();
    if (!oddsList || oddsList.length < 24) {
      console.error('Insufficient odds data. At least 24 categories are required.');
      return;
    }

    // Submit selection 1: Higher odds
    const higherSelection = getHigherOddsSelection(oddsList);
    await submitInvestmentSelection(AUTO_USER_ID, higherSelection, INVESTMENT_AMOUNTS[0]);
    await submitDemoInvestmentSelection(AUTO_USER_ID, higherSelection, INVESTMENT_AMOUNTS[0]);


    // Submit selection 2: Lower odds
    const lowerSelection = getLowerOddsSelection(oddsList, higherSelection);
    await submitInvestmentSelection(AUTO_USER_ID, lowerSelection, INVESTMENT_AMOUNTS[1]);
    await submitDemoInvestmentSelection(AUTO_USER_ID, lowerSelection, INVESTMENT_AMOUNTS[1]);

    // Submit selection 2: Lower odds
    const lowerSelection2 = getLowerOddsSelection2(oddsList);
    await submitInvestmentSelection(AUTO_USER_ID, lowerSelection2, INVESTMENT_AMOUNTS[1]);
    await submitDemoInvestmentSelection(AUTO_USER_ID, lowerSelection2, INVESTMENT_AMOUNTS[1]);

    // Submit selections 3–10: 8 random groups of 3 categories
    const randomGroups = get8RandomGroupsOf3(oddsList);
    for (let i = 0; i < randomGroups.length; i++) {
      const group = randomGroups[i];
      const amount = INVESTMENT_AMOUNTS[i + 2];
      await submitInvestmentSelection(AUTO_USER_ID, group, amount);
      await submitDemoInvestmentSelection(AUTO_USER_ID, group, amount);
    }

    console.log('Automated investment complete.');
  } catch (err) {
    console.error('Unhandled error:', err.message);
  }
}

function startAllCycles() {
  // 🕒 Run every 5 minutes starting from 12:02 AM (e.g., 12:02, 12:07, 12:12, ...)
cron.schedule('2-59/5 * * * *', async () => {
  console.log('⏰ Running scheduled automated investment...');
  await automatedInvestment();
});
// In-memory lock flags per timeframe
const locks = {
  '5m': false,
  '15m': false,
  '30m': false,
  '1h': false,
  '4h': false,
  '1d': false,
};

function withLock(key, job) {
  return async () => {
    if (locks[key]) {
      console.log(`⏳ Skipping ${key} job: already running.`);
      return;
    }

    locks[key] = true;
    console.log(`🔒 Starting ${key} job...`);

    try {
      await job();
      console.log(`✅ Finished ${key} job.`);
    } catch (err) {
      console.error(`❌ Error in ${key} job:`, err.message);
    } finally {
      locks[key] = false;
    }
  };
}
// 🕒 Run every 5 minutes
cron.schedule('*/5 * * * *', withLock('5m', async () => {
  console.log("🔁 5m: Completing and activating investments...");
  await updateInvestmentStatusToCompleted5();
  await updateInvestmentSelectionStatusToCompleted5();
  await DemoupdateInvestmentSelectionStatusToCompleted5();
  await updateInvestmentStatusToActive();
  await updateInvestmentSelectionStatusToActive();
  await updateDemoInvestmentSelectionStatusToActive();
  console.log("🔁 5m: Updating odds...");
  await updateOdds();
}));

// 🕒 Run every 5 minutes starting at xx:01
cron.schedule(
  '1,6,11,16,21,26,31,36,41,46,51,56 * * * *',
  withLock('5m', async () => {

    console.log("🔁 5m: Triggering outcome processing...");
    console.log("🕒 Running scheduled outcome processing check...");

    await triggerOutcomeProcessing();

  })
);

// 🕒 Run every 15 minutes
cron.schedule('*/15 * * * *', withLock('15m', async () => {
  console.log("🔁 15m: Completing investments...");
  await updateInvestmentStatusToCompleted15();
  await updateInvestmentSelectionStatusToCompleted15();
  await DemoupdateInvestmentSelectionStatusToCompleted15();
}));

// 🕒 Run every 30 minutes
cron.schedule('*/30 * * * *', withLock('30m', async () => {
  console.log("🔁 30m: Completing investments...");
  await updateInvestmentStatusToCompleted30();
  await updateInvestmentSelectionStatusToCompleted30();
  await DemoupdateInvestmentSelectionStatusToCompleted30();
}));

// 🕒 Run every hour
cron.schedule('0 * * * *', withLock('1h', async () => {
  console.log("🔁 1h: Completing investments...");
  await updateInvestmentStatusToCompleted1h();
  await updateInvestmentSelectionStatusToCompleted1h();
  await DemoupdateInvestmentSelectionStatusToCompleted1h();
}));

// 🕒 Run every 4 hours
cron.schedule('0 */4 * * *', withLock('4h', async () => {
  console.log("🔁 4h: Completing investments...");
  await updateInvestmentStatusToCompleted4h();
  await updateInvestmentSelectionStatusToCompleted4h();
  await DemoupdateInvestmentSelectionStatusToCompleted4h();
}));

// 🕒 Run daily at midnight
cron.schedule('0 0 * * *', withLock('1d', async () => {
  console.log("🔁 1d: Completing investments...");
  await updateInvestmentStatusToCompleted1d();
  await updateInvestmentSelectionStatusToCompleted1d();
  await DemoupdateInvestmentSelectionStatusToCompleted1d();
}));

}

module.exports = { startAllCycles };
