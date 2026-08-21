const express = require ('express');
const Investment = require('../models/Investment');
const InvestmentSelection = require('../models/InvestmentSelection');
const InvestmentSelectionDemo = require('../models/InvestmentSelectionDemo');
const { Op } = require('sequelize');
const Timeframe = require('../models/timeframe');
const Categories = require('../models/Categories');
const sequelize = require("../db");
const PlatformFee = require('../models/PlatformFee');
const SharePlatformFee = require('../models/SharePlatformFee');
const CategoryOutcome = require("../models/CategoryOutcome");
require('dotenv').config();
const CumulativeData = require('../models/CumulativeData');
const User = require('../models/User'); // Adjust the path if needed
const GroupedInvestment = require('../models/GroupedInvestment');
const GroupedDemoInvestment = require('../models/GroupedDemoInvestment');
const { v4: uuidv4 } = require('uuid');
const Member = require('../models/Member');
const cron = require('node-cron');
const router = express.Router();


async function updateDemoCategoryInvestments(
  category,
  outcome,
  investmentSelections,
  transaction,
  bothLose = false
) {

  for (const selection of investmentSelections) {

    const selectedInvestments =
      Array.isArray(selection.selectedInvestments)
        ? selection.selectedInvestments
        : [];

    let changed = false;


    // ========================================================
    // CREATE A NEW ARRAY
    // ========================================================

    const updatedInvestments =
      selectedInvestments.map(investment => {

        // ----------------------------------------------------
        // ONLY TOUCH THIS CATEGORY
        // ----------------------------------------------------

        if (
          investment.category !== category
        ) {

          return investment;

        }


        // ----------------------------------------------------
        // BOTH LOSE / NEUTRAL
        // ----------------------------------------------------

        if (bothLose) {

          if (
            investment.choice === "Demand" ||
            investment.choice === "Supply"
          ) {

            changed = true;

            return {
              ...investment,
              outcome: "neutral",
            };

          }

          return investment;

        }


        // ----------------------------------------------------
        // NORMAL OUTCOME
        // ----------------------------------------------------

        if (
          investment.choice === outcome
        ) {

          changed = true;

          return {
            ...investment,
            outcome: "win",
          };

        }


        const losingChoice =
          outcome === "Demand"
            ? "Supply"
            : "Demand";


        if (
          investment.choice === losingChoice
        ) {

          changed = true;

          return {
            ...investment,
            outcome: "loss",
          };

        }


        return investment;

      });


    // ========================================================
    // SAVE JSONB ARRAY BACK TO DATABASE
    // ========================================================

    if (changed) {

      selection.selectedInvestments =
        updatedInvestments;


      await selection.save({
        transaction,
      });


      console.log(
        `✅ Updated ${category} inside demoInvestmentSelection ${selection.investmentCode}`
      );

    }

  }

}


// ============================================================
// NEW INVESTMENT OUTCOME ENGINE
// SOURCE: InvestmentSelection ONLY
// ============================================================


// ============================================================
// HELPER: SHUFFLE ARRAY
// ============================================================

function shuffleArray(array) {

  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];

  }

  return shuffled;
}


// ============================================================
// HELPER: GET LOWER EROI CHOICE
// ============================================================

function getLowerEROIChoice(
  demandEROI,
  supplyEROI
) {

  if (demandEROI < supplyEROI) {
    return "Demand";
  }

  if (supplyEROI < demandEROI) {
    return "Supply";
  }

  // Equal ROI - random choice
  return Math.random() < 0.5
    ? "Demand"
    : "Supply";
}


// ============================================================
// HELPER: GET HIGHER EROI CHOICE
// ============================================================

function getHigherEROIChoice(
  demandEROI,
  supplyEROI
) {

  if (demandEROI > supplyEROI) {
    return "Demand";
  }

  if (supplyEROI > demandEROI) {
    return "Supply";
  }

  // Equal ROI - random choice
  return Math.random() < 0.5
    ? "Demand"
    : "Supply";
}


// ============================================================
// STEP 1
// FETCH INVESTMENT SELECTIONS READY FOR PROCESSING
//
// IMPORTANT:
//
// We no longer fetch Investment.
//
// We fetch InvestmentSelection where:
//
// status  = completed
// outcome = active
//
// The actual investments are inside:
// selectedInvestments
// ============================================================

async function fetchUnprocessedInvestmentSelections(
  transaction
) {

  console.log(
    "\nFetching completed InvestmentSelections with active outcome..."
  );

  const investmentSelections =
    await InvestmentSelection.findAll({

      where: {

        status: "completed",

        outcome: "active",

      },

      order: [
        ["createdAt", "ASC"],
      ],

      transaction,

      lock: transaction
        ? transaction.LOCK.UPDATE
        : undefined,

    });


  console.log(
    `Found ${investmentSelections.length} InvestmentSelections to process.`
  );


  return investmentSelections;
}

async function fetchUnprocessedDemoInvestmentSelections(
  transaction
) {

  console.log(
    "\nFetching completed InvestmentSelections with active outcome..."
  );

  const investmentSelections =
    await InvestmentSelectionDemo.findAll({

      where: {

        status: "completed",

        outcome: "active",

      },

      order: [
        ["createdAt", "ASC"],
      ],

      transaction,

      lock: transaction
        ? transaction.LOCK.UPDATE
        : undefined,

    });


  console.log(
    `Found ${investmentSelections.length} InvestmentSelections to process.`
  );


  return investmentSelections;
}


// ============================================================
// STEP 2
// FLATTEN ALL selectedInvestments
//
// InvestmentSelection
//        |
//        └── selectedInvestments[]
//                  |
//                  ├── Agriculture / Demand
//                  ├── Agriculture / Supply
//                  ├── Sports / Supply
//                  └── etc.
//
// We create one flat array for the outcome engine.
//
// IMPORTANT:
// Each investment keeps a reference to its parent
// InvestmentSelection through:
//
// investment.selection
// ============================================================

function flattenInvestmentSelections(
  investmentSelections
) {

  const investments = [];


  for (
    const selection of investmentSelections
  ) {

    const selectedInvestments =
      Array.isArray(
        selection.selectedInvestments
      )
        ? selection.selectedInvestments
        : [];


    for (
      const investment of selectedInvestments
    ) {

      investments.push({

        ...investment,

        selection,

      });

    }

  }


  console.log(
    `Flattened ${investments.length} investments from ${investmentSelections.length} InvestmentSelections.`
  );


  return investments;
}


// ============================================================
// STEP 3
// GROUP INVESTMENTS
//
// Category
//     ├── Demand
//     └── Supply
// ============================================================

function groupInvestments(
  investments
) {

  const groupedByCategory = {};


  for (
    const investment of investments
  ) {

    const category =
      investment.category;


    if (!category) {
      continue;
    }


    if (
      !groupedByCategory[category]
    ) {

      groupedByCategory[category] = {

        Demand: [],

        Supply: [],

      };

    }


    if (
      investment.choice === "Demand" ||
      investment.choice === "Supply"
    ) {

      groupedByCategory[category][
        investment.choice
      ].push(investment);

    }

  }


  return groupedByCategory;
}


// ============================================================
// STEP 4
// CALCULATE EROI FOR EVERY CATEGORY
//
// Uses investment.roi directly from:
//
// InvestmentSelection.selectedInvestments[]
// ============================================================

function calculateCategoryEROIs(
  groupedByCategory
) {

  const eroiCatChoices = {};

  const eroiCatTotal = {};


  for (
    const category of Object.keys(
      groupedByCategory
    )
  ) {

    const demandInvestments =
      groupedByCategory[category].Demand;


    const supplyInvestments =
      groupedByCategory[category].Supply;


    let demandEROI = 0;

    let supplyEROI = 0;


    // --------------------------------------------------------
    // DEMAND
    // --------------------------------------------------------

    for (
      const investment of demandInvestments
    ) {

      demandEROI += Number(
        investment.roi || 0
      );

    }


    // --------------------------------------------------------
    // SUPPLY
    // --------------------------------------------------------

    for (
      const investment of supplyInvestments
    ) {

      supplyEROI += Number(
        investment.roi || 0
      );

    }


    eroiCatChoices[category] = {

      Demand: demandEROI,

      Supply: supplyEROI,

    };


    eroiCatTotal[category] =
      demandEROI +
      supplyEROI;

  }


  return {

    eroiCatChoices,

    eroiCatTotal,

  };
}


// ============================================================
// STEP 5
// CALCULATE GLOBAL SUM ROI
// AND GLOBAL MEAN ROI
// ============================================================

function calculateGlobalROI(
  eroiCatChoices
) {

  let sumROI = 0;

  let numberOfCategories = 0;


  for (
    const category of Object.keys(
      eroiCatChoices
    )
  ) {

    sumROI +=
      Number(
        eroiCatChoices[category].Demand || 0
      );


    sumROI +=
      Number(
        eroiCatChoices[category].Supply || 0
      );


    numberOfCategories++;

  }


  const meanROI =
    numberOfCategories > 0

      ? sumROI /
        (numberOfCategories * 2)

      : 0;


  return {

    sumROI,

    meanROI,

  };
}


// ============================================================
// STEP 6
// FETCH CURRENT NINE CATEGORIES
// ============================================================

async function getCurrentNineCategories(
  availableCategories,
  transaction
) {

  let categoryRecord =
    await Categories.findOne({

      where: {
        id: 1,
      },

      transaction,

      lock: transaction
        ? transaction.LOCK.UPDATE
        : undefined,

    });


  // ----------------------------------------------------------
  // If current set already exists
  // ----------------------------------------------------------

  if (
    categoryRecord &&
    Array.isArray(
      categoryRecord.categories
    ) &&
    categoryRecord.categories.length > 0
  ) {

    return categoryRecord.categories;

  }


  // ----------------------------------------------------------
  // No current set exists
  // ----------------------------------------------------------

  const shuffled =
    shuffleArray(
      availableCategories
    );


  const selectedCategories =
    shuffled.slice(0, 9);


  // ----------------------------------------------------------
  // Create current set
  // ----------------------------------------------------------

  if (!categoryRecord) {

    categoryRecord =
      await Categories.create(

        {

          id: 1,

          categories:
            selectedCategories,

          createdAt:
            new Date(),

        },

        {

          transaction,

        }

      );

  } else {

    await categoryRecord.update(

      {

        categories:
          selectedCategories,

        createdAt:
          new Date(),

      },

      {

        transaction,

      }

    );

  }


  console.log(
    "\nNew nine categories selected:"
  );

  console.log(
    selectedCategories
  );


  return selectedCategories;
}


// ============================================================
// STEP 7
// CALCULATE TOTAL NET INVESTMENT
//
// 95% of EACH InvestmentSelection.amount
// ============================================================

function calculateTotalNetInvestment(
  investmentSelections
) {

  let totalNetInvestment = 0;


  for (
    const selection of investmentSelections
  ) {

    const amount =
      Number(
        selection.amount || 0
      );


    const netAmount =
      0.95 * amount;


    totalNetInvestment +=
      netAmount;

  }


  return totalNetInvestment;
}


// ============================================================
// STEP 8
// CREATE TWO CATEGORY SECTIONS
// ============================================================

function arrangeCategorySections(
  eroiCatChoices,
  currentNineCategories
) {

  const allCategories =
    Object.keys(
      eroiCatChoices
    );


  const currentNineSet =
    new Set(
      currentNineCategories
    );


  // ----------------------------------------------------------
  // SECTION 1
  // Categories NOT inside current nine
  // ----------------------------------------------------------

  const sectionOne =
    allCategories.filter(
      category =>
        !currentNineSet.has(category)
    );


  const randomizedSectionOne =
    shuffleArray(
      sectionOne
    );


  // ----------------------------------------------------------
  // SECTION 2
  // Categories INSIDE current nine
  // ----------------------------------------------------------

  const sectionTwo =
    allCategories.filter(
      category =>
        currentNineSet.has(category)
    );


  // ----------------------------------------------------------
  // Sort Section 2 according to LOWER EROI
  // ----------------------------------------------------------

  sectionTwo.sort(

    (
      categoryA,
      categoryB
    ) => {

      const a =
        eroiCatChoices[
          categoryA
        ];

      const b =
        eroiCatChoices[
          categoryB
        ];


      const minA =
        Math.min(
          Number(a.Demand || 0),
          Number(a.Supply || 0)
        );


      const minB =
        Math.min(
          Number(b.Demand || 0),
          Number(b.Supply || 0)
        );


      return minA - minB;

    }

  );


  return {

    sectionOne:
      randomizedSectionOne,

    sectionTwo,

  };
}


// ============================================================
// STEP 9
// CALCULATE SUM2ROI
// ============================================================

function calculateSectionTwoROI(
  sectionTwo,
  eroiCatChoices
) {

  let sum2ROI = 0;


  for (
    const category of sectionTwo
  ) {

    const demandEROI =
      Number(
        eroiCatChoices[category].Demand || 0
      );


    const supplyEROI =
      Number(
        eroiCatChoices[category].Supply || 0
      );


    const higherEROI =
      Math.max(
        demandEROI,
        supplyEROI
      );


    sum2ROI +=
      higherEROI;

  }


  return sum2ROI;
}


// ============================================================
// STEP 10
// UPDATE INVESTMENTS INSIDE selectedInvestments
//
// THIS REPLACES:
//
// Investment.update()
//
// We now modify:
//
// InvestmentSelection.selectedInvestments[]
//
// Rules:
//
// Demand wins:
//   Demand -> win
//   Supply -> loss
//
// Supply wins:
//   Supply -> win
//   Demand -> loss
//
// bothLoss:
//   Demand -> neutral
//   Supply -> neutral
//
// IMPORTANT:
// Nothing is written to the Investment table.
// ============================================================

async function updateCategoryInvestments(
  category,
  outcome,
  investmentSelections,
  transaction,
  bothLose = false
) {

  for (
    const selection of investmentSelections
  ) {

    const selectedInvestments =
      Array.isArray(
        selection.selectedInvestments
      )
        ? selection.selectedInvestments
        : [];


    let changed = false;


    // ========================================================
    // BOTH CHOICES LOSE
    // ========================================================

    if (bothLose) {

      for (
        const investment of selectedInvestments
      ) {

        if (
          investment.category === category &&
          (
            investment.choice === "Demand" ||
            investment.choice === "Supply"
          )
        ) {

          investment.outcome =
            "neutral";

          changed = true;

        }

      }

    }


    // ========================================================
    // NORMAL WINNING CHOICE
    // ========================================================

    else {

      const losingChoice =
        outcome === "Demand"
          ? "Supply"
          : "Demand";


      for (
        const investment of selectedInvestments
      ) {

        if (
          investment.category === category
        ) {

          // Winning choice
          if (
            investment.choice === outcome
          ) {

            investment.outcome =
              "win";

            changed = true;

          }

          // Losing choice
          else if (
            investment.choice === losingChoice
          ) {

            investment.outcome =
              "loss";

            changed = true;

          }

        }

      }

    }


    // ========================================================
    // SAVE JSONB ARRAY BACK TO DATABASE
    // ========================================================

    if (changed) {

      selection.changed(
        "selectedInvestments",
        true
      );


      await selection.save({
        transaction,
      });


      console.log(
        `✅ Updated ${category} inside InvestmentSelection ${selection.investmentCode}`
      );

    }

  }

}


// ============================================================
// STEP 11
// SAVE CATEGORY OUTCOME
// ============================================================

async function saveCategoryOutcome(
  category,
  outcome,
  categoryEROI,
  meanROI,
  transaction
) {

  await CategoryOutcome.create(

    {

      category,

      outcome,

      maxEROI:
        Math.max(

          Number(
            categoryEROI.Demand || 0
          ),

          Number(
            categoryEROI.Supply || 0
          )

        ),

      meanROI,

      timestamp:
        new Date(),

    },

    {

      transaction,

    }

  );

}


async function processDemoSectionOne(
  sectionOne,
  eroiCatChoices,
  initialSumROI,
  initialTotalNetInvestment,
  meanROI,
  investmentSelections,
  transaction
) {

  let sumROI =
    initialSumROI;


  let totalNetInvestment =
    initialTotalNetInvestment;


  const processedCategories = [];


  console.log(
    "\n======================================="
  );

  console.log(
    "PROCESSING SECTION 1"
  );

  console.log(
    "======================================="
  );


  for (
    const category of sectionOne
  ) {

    const categoryEROI =
      eroiCatChoices[category];


    const demandEROI =
      Number(
        categoryEROI.Demand || 0
      );


    const supplyEROI =
      Number(
        categoryEROI.Supply || 0
      );


    // ========================================================
    // LOWER EROI WINS
    // ========================================================

    const outcome =
      getLowerEROIChoice(
        demandEROI,
        supplyEROI
      );


    const winningEROI =
      outcome === "Demand"
        ? demandEROI
        : supplyEROI;


    const losingEROI =
      outcome === "Demand"
        ? supplyEROI
        : demandEROI;


    // ========================================================
    // CHECK WHETHER WINNING EROI CAN BE COVERED
    // ========================================================

    let bothLose = false;


    if (
      winningEROI >
      totalNetInvestment
    ) {

      bothLose = true;


      console.log(
        `⚠️ Winning EROI ₦${winningEROI.toFixed(2)} exceeds remaining pool ₦${totalNetInvestment.toFixed(2)}.`
      );


      console.log(
        `⚠️ ${category}: BOTH choices will be LOSS.`
      );

    }


    // ========================================================
    // ONLY DEDUCT POOL IF REAL WIN
    // ========================================================

    if (!bothLose) {

      sumROI -=
        losingEROI;


      totalNetInvestment -=
        winningEROI;


      sumROI =
        Math.max(
          0,
          sumROI
        );


      totalNetInvestment =
        Math.max(
          0,
          totalNetInvestment
        );

    }


    console.log(
      `\nCategory: ${category}`
    );

    console.log(
      `Demand EROI: ${demandEROI.toFixed(2)}`
    );

    console.log(
      `Supply EROI: ${supplyEROI.toFixed(2)}`
    );

    console.log(
      `Outcome: ${outcome}`
    );

    console.log(
      `Winning EROI: ${winningEROI.toFixed(2)}`
    );

    console.log(
      `Losing EROI: ${losingEROI.toFixed(2)}`
    );

    console.log(
      `Remaining sumROI: ${sumROI.toFixed(2)}`
    );

    console.log(
      `Remaining totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
    );

    // ========================================================
    // SAVE CATEGORY OUTCOME
    // ========================================================

    await updateDemoCategoryInvestments(

      category,

      outcome,

      investmentSelections,

      transaction,

      bothLose

    );


    processedCategories.push(
      category
    );

  }


  return {

    sumROI,

    totalNetInvestment,

    processedCategories,

  };

}


// ============================================================
// STEP 12
// PROCESS SECTION 1
//
// LOWER EROI WINS
//
// If equal:
// Random winner
//
// sumROI -= LOSING EROI
// totalNetInvestment -= WINNING EROI
// ============================================================

async function processSectionOne(
  sectionOne,
  eroiCatChoices,
  initialSumROI,
  initialTotalNetInvestment,
  meanROI,
  investmentSelections,
  transaction
) {

  let sumROI =
    initialSumROI;


  let totalNetInvestment =
    initialTotalNetInvestment;


  const processedCategories = [];


  console.log(
    "\n======================================="
  );

  console.log(
    "PROCESSING SECTION 1"
  );

  console.log(
    "======================================="
  );


  for (
    const category of sectionOne
  ) {

    const categoryEROI =
      eroiCatChoices[category];


    const demandEROI =
      Number(
        categoryEROI.Demand || 0
      );


    const supplyEROI =
      Number(
        categoryEROI.Supply || 0
      );


    // ========================================================
    // LOWER EROI WINS
    // ========================================================

    const outcome =
      getLowerEROIChoice(
        demandEROI,
        supplyEROI
      );


    const winningEROI =
      outcome === "Demand"
        ? demandEROI
        : supplyEROI;


    const losingEROI =
      outcome === "Demand"
        ? supplyEROI
        : demandEROI;


    // ========================================================
    // CHECK WHETHER WINNING EROI CAN BE COVERED
    // ========================================================

    let bothLose = false;


    if (
      winningEROI >
      totalNetInvestment
    ) {

      bothLose = true;


      console.log(
        `⚠️ Winning EROI ₦${winningEROI.toFixed(2)} exceeds remaining pool ₦${totalNetInvestment.toFixed(2)}.`
      );


      console.log(
        `⚠️ ${category}: BOTH choices will be LOSS.`
      );

    }


    // ========================================================
    // ONLY DEDUCT POOL IF REAL WIN
    // ========================================================

    if (!bothLose) {

      sumROI -=
        losingEROI;


      totalNetInvestment -=
        winningEROI;


      sumROI =
        Math.max(
          0,
          sumROI
        );


      totalNetInvestment =
        Math.max(
          0,
          totalNetInvestment
        );

    }


    console.log(
      `\nCategory: ${category}`
    );

    console.log(
      `Demand EROI: ${demandEROI.toFixed(2)}`
    );

    console.log(
      `Supply EROI: ${supplyEROI.toFixed(2)}`
    );

    console.log(
      `Outcome: ${outcome}`
    );

    console.log(
      `Winning EROI: ${winningEROI.toFixed(2)}`
    );

    console.log(
      `Losing EROI: ${losingEROI.toFixed(2)}`
    );

    console.log(
      `Remaining sumROI: ${sumROI.toFixed(2)}`
    );

    console.log(
      `Remaining totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
    );


    // ========================================================
    // UPDATE selectedInvestments JSONB
    // ========================================================

    await updateCategoryInvestments(

      category,

      outcome,

      investmentSelections,

      transaction,

      bothLose

    );


    // ========================================================
    // SAVE CATEGORY OUTCOME
    // ========================================================

    await saveCategoryOutcome(

      category,

      outcome,

      categoryEROI,

      meanROI,

      transaction

    );


    processedCategories.push(
      category
    );

  }


  return {

    sumROI,

    totalNetInvestment,

    processedCategories,

  };

}


// ============================================================
// STEP 13
// PROCESS SECTION 2
//
// FIRST:
//
// sum2ROI > totalNetInvestment
//
//     LOWER EROI WINS
//
// Once:
//
// totalNetInvestment >= sum2ROI
//
//     HIGHER EROI WINS
// ============================================================

async function processSectionTwo(
  sectionTwo,
  eroiCatChoices,
  startingSumROI,
  startingTotalNetInvestment,
  meanROI,
  investmentSelections,
  transaction
) {

  let sumROI =
    startingSumROI;


  let totalNetInvestment =
    startingTotalNetInvestment;


  let remainingSectionTwo =
    [...sectionTwo];


  // ==========================================================
  // SUM BOTH EROIs
  // ==========================================================

  let sum2ROI = 0;


  for (
    const category of remainingSectionTwo
  ) {

    const demandEROI =
      Number(
        eroiCatChoices[category].Demand || 0
      );


    const supplyEROI =
      Number(
        eroiCatChoices[category].Supply || 0
      );


    sum2ROI +=
      demandEROI +
      supplyEROI;

  }


  let switchedToHigher =
    false;


  const processedCategories = [];


  console.log(
    "\n======================================="
  );

  console.log(
    "PROCESSING SECTION 2"
  );

  console.log(
    "======================================="
  );


  console.log(
    `Initial sum2ROI: ${sum2ROI.toFixed(2)}`
  );


  console.log(
    `Initial totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
  );


  for (
    const category of sectionTwo
  ) {

    const categoryEROI =
      eroiCatChoices[category];


    const demandEROI =
      Number(
        categoryEROI.Demand || 0
      );


    const supplyEROI =
      Number(
        categoryEROI.Supply || 0
      );


    // ========================================================
    // DECIDE WINNER
    // ========================================================

    let outcome;


    if (
      sum2ROI >
      totalNetInvestment
    ) {

      outcome =
        getLowerEROIChoice(
          demandEROI,
          supplyEROI
        );

    } else {

      switchedToHigher =
        true;


      outcome =
        getHigherEROIChoice(
          demandEROI,
          supplyEROI
        );

    }


    const winningEROI =
      outcome === "Demand"
        ? demandEROI
        : supplyEROI;


    const losingEROI =
      outcome === "Demand"
        ? supplyEROI
        : demandEROI;


    const categoryTotalEROI =
      demandEROI +
      supplyEROI;


    // ========================================================
    // CHECK POOL BEFORE ALLOWING WIN
    // ========================================================

    let bothLose = false;


    if (
      winningEROI >
      totalNetInvestment
    ) {

      bothLose = true;


      console.log(
        `⚠️ Winning EROI ₦${winningEROI.toFixed(2)} exceeds remaining pool ₦${totalNetInvestment.toFixed(2)}.`
      );


      console.log(
        `⚠️ ${category}: BOTH choices will be LOSS.`
      );

    }


    // ========================================================
    // REMOVE CATEGORY FROM SUM2ROI
    // ========================================================

    sum2ROI -=
      categoryTotalEROI;


    sum2ROI =
      Math.max(
        0,
        sum2ROI
      );


    // ========================================================
    // ONLY DEDUCT IF REAL WIN
    // ========================================================

    if (!bothLose) {

      sumROI -=
        losingEROI;


      sumROI =
        Math.max(
          0,
          sumROI
        );


      totalNetInvestment -=
        winningEROI;


      totalNetInvestment =
        Math.max(
          0,
          totalNetInvestment
        );

    }


    // ========================================================
    // LOG
    // ========================================================

    console.log(
      `\nCategory: ${category}`
    );

    console.log(
      `Demand EROI: ${demandEROI.toFixed(2)}`
    );

    console.log(
      `Supply EROI: ${supplyEROI.toFixed(2)}`
    );

    console.log(
      `Outcome: ${outcome}`
    );

    console.log(
      `Winning EROI: ${winningEROI.toFixed(2)}`
    );

    console.log(
      `Losing EROI: ${losingEROI.toFixed(2)}`
    );

    console.log(
      `Remaining sumROI: ${sumROI.toFixed(2)}`
    );

    console.log(
      `Remaining sum2ROI: ${sum2ROI.toFixed(2)}`
    );

    console.log(
      `Remaining totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
    );

    console.log(
      `Mode: ${
        switchedToHigher
          ? "HIGHER EROI WINS"
          : "LOWER EROI WINS"
      }`
    );


    // ========================================================
    // UPDATE selectedInvestments JSONB
    // ========================================================

    await updateCategoryInvestments(

      category,

      outcome,

      investmentSelections,

      transaction,

      bothLose

    );


    // ========================================================
    // SAVE CATEGORY OUTCOME
    // ========================================================

    await saveCategoryOutcome(

      category,

      outcome,

      categoryEROI,

      meanROI,

      transaction

    );


    processedCategories.push(
      category
    );

  }


  return {

    sumROI,

    sum2ROI,

    totalNetInvestment,

    processedCategories,

    switchedToHigher,

  };

}




async function processDemoSectionTwo(
  sectionTwo,
  eroiCatChoices,
  startingSumROI,
  startingTotalNetInvestment,
  meanROI,
  investmentSelections,
  transaction
) {

  let sumROI =
    startingSumROI;


  let totalNetInvestment =
    startingTotalNetInvestment;


  let remainingSectionTwo =
    [...sectionTwo];


  // ==========================================================
  // SUM BOTH EROIs
  // ==========================================================

  let sum2ROI = 0;


  for (
    const category of remainingSectionTwo
  ) {

    const demandEROI =
      Number(
        eroiCatChoices[category].Demand || 0
      );


    const supplyEROI =
      Number(
        eroiCatChoices[category].Supply || 0
      );


    sum2ROI +=
      demandEROI +
      supplyEROI;

  }


  let switchedToHigher =
    false;


  const processedCategories = [];


  console.log(
    "\n======================================="
  );

  console.log(
    "PROCESSING SECTION 2"
  );

  console.log(
    "======================================="
  );


  console.log(
    `Initial sum2ROI: ${sum2ROI.toFixed(2)}`
  );


  console.log(
    `Initial totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
  );


  for (
    const category of sectionTwo
  ) {

    const categoryEROI =
      eroiCatChoices[category];


    const demandEROI =
      Number(
        categoryEROI.Demand || 0
      );


    const supplyEROI =
      Number(
        categoryEROI.Supply || 0
      );


    // ========================================================
    // DECIDE WINNER
    // ========================================================

    let outcome;


    if (
      sum2ROI >
      totalNetInvestment
    ) {

      outcome =
        getLowerEROIChoice(
          demandEROI,
          supplyEROI
        );

    } else {

      switchedToHigher =
        true;


      outcome =
        getHigherEROIChoice(
          demandEROI,
          supplyEROI
        );

    }


    const winningEROI =
      outcome === "Demand"
        ? demandEROI
        : supplyEROI;


    const losingEROI =
      outcome === "Demand"
        ? supplyEROI
        : demandEROI;


    const categoryTotalEROI =
      demandEROI +
      supplyEROI;


    // ========================================================
    // CHECK POOL BEFORE ALLOWING WIN
    // ========================================================

    let bothLose = false;


    if (
      winningEROI >
      totalNetInvestment
    ) {

      bothLose = true;


      console.log(
        `⚠️ Winning EROI ₦${winningEROI.toFixed(2)} exceeds remaining pool ₦${totalNetInvestment.toFixed(2)}.`
      );


      console.log(
        `⚠️ ${category}: BOTH choices will be LOSS.`
      );

    }


    // ========================================================
    // REMOVE CATEGORY FROM SUM2ROI
    // ========================================================

    sum2ROI -=
      categoryTotalEROI;


    sum2ROI =
      Math.max(
        0,
        sum2ROI
      );


    // ========================================================
    // ONLY DEDUCT IF REAL WIN
    // ========================================================

    if (!bothLose) {

      sumROI -=
        losingEROI;


      sumROI =
        Math.max(
          0,
          sumROI
        );


      totalNetInvestment -=
        winningEROI;


      totalNetInvestment =
        Math.max(
          0,
          totalNetInvestment
        );

    }


    // ========================================================
    // LOG
    // ========================================================

    console.log(
      `\nCategory: ${category}`
    );

    console.log(
      `Demand EROI: ${demandEROI.toFixed(2)}`
    );

    console.log(
      `Supply EROI: ${supplyEROI.toFixed(2)}`
    );

    console.log(
      `Outcome: ${outcome}`
    );

    console.log(
      `Winning EROI: ${winningEROI.toFixed(2)}`
    );

    console.log(
      `Losing EROI: ${losingEROI.toFixed(2)}`
    );

    console.log(
      `Remaining sumROI: ${sumROI.toFixed(2)}`
    );

    console.log(
      `Remaining sum2ROI: ${sum2ROI.toFixed(2)}`
    );

    console.log(
      `Remaining totalNetInvestment: ${totalNetInvestment.toFixed(2)}`
    );

    console.log(
      `Mode: ${
        switchedToHigher
          ? "HIGHER EROI WINS"
          : "LOWER EROI WINS"
      }`
    );


    // ========================================================
    // UPDATE selectedInvestments JSONB
    // ========================================================

    await updateDemoCategoryInvestments(

      category,

      outcome,

      investmentSelections,

      transaction,

      bothLose

    );


    processedCategories.push(
      category
    );

  }


  return {

    sumROI,

    sum2ROI,

    totalNetInvestment,

    processedCategories,

    switchedToHigher,

  };

}



// ============================================================
// STEP 14
// MARK INVESTMENT SELECTIONS AS COMPLETED
//
// BEFORE:
//
// status = completed
// outcome = active
//
// AFTER:
//
// status = completed
// outcome = completed
//
// The individual investments inside selectedInvestments
// have already received:
//
// win
// loss
// neutral
// ============================================================

async function completeInvestmentSelections(
  investmentSelections,
  transaction
) {

  console.log(
    "\nUpdating InvestmentSelections outcome to completed..."
  );


  for (
    const selection of investmentSelections
  ) {

    await selection.update(

      {

        outcome:
          "completed",

      },

      {

        transaction,

      }

    );

  }


  console.log(
    `✅ ${investmentSelections.length} InvestmentSelections marked as completed.`
  );


  return investmentSelections.length;
}


// ============================================================
// MAIN FUNCTION
// ============================================================

async function processInvestmentsNew() {

  const transaction =
    await sequelize.transaction();


  try {

    console.log(
      "\n\n=========================================="
    );

    console.log(
      "STARTING NEW INVESTMENT OUTCOME ENGINE"
    );

    console.log(
      "=========================================="
    );


    // ========================================================
    // 1. FETCH INVESTMENT SELECTIONS
    // ========================================================

    const investmentSelections =
      await fetchUnprocessedInvestmentSelections(
        transaction
      );


    // ========================================================
    // 2. IF NOTHING TO PROCESS, STOP
    // ========================================================

    if (
      investmentSelections.length === 0
    ) {

      console.log(
        "No completed InvestmentSelections require processing."
      );


      await transaction.commit();


      return null;

    }


    // ========================================================
    // 3. FLATTEN selectedInvestments
    //
    // THIS IS NOW THE SOURCE OF ALL INVESTMENTS
    // ========================================================

    const investments =
      flattenInvestmentSelections(
        investmentSelections
      );


    // ========================================================
    // 4. IF selectedInvestments ARE EMPTY
    // ========================================================

    if (
      investments.length === 0
    ) {

      console.log(
        "InvestmentSelections were found, but selectedInvestments is empty."
      );


      await transaction.commit();


      return null;

    }


    // ========================================================
    // 5. GROUP INVESTMENTS BY CATEGORY
    // ========================================================

    const groupedByCategory =
      groupInvestments(
        investments
      );


    // ========================================================
    // 6. CALCULATE EROI
    // ========================================================

    const {

      eroiCatChoices,

      eroiCatTotal,

    } =
      calculateCategoryEROIs(
        groupedByCategory
      );


    console.log(
      "\nEROI BY CATEGORY:"
    );


    console.log(
      JSON.stringify(
        eroiCatChoices,
        null,
        2
      )
    );


    // ========================================================
    // 7. CALCULATE GLOBAL SUM ROI + MEAN ROI
    // ========================================================

    const {

      sumROI: initialSumROI,

      meanROI,

    } =
      calculateGlobalROI(
        eroiCatChoices
      );


    console.log(
      `\nInitial sumROI: ${initialSumROI.toFixed(2)}`
    );


    console.log(
      `Global meanROI: ${meanROI.toFixed(2)}`
    );


    // ========================================================
    // 8. CALCULATE TOTAL NET INVESTMENT
    // ========================================================

    const initialTotalNetInvestment =
      calculateTotalNetInvestment(
        investmentSelections
      );


    console.log(
      `Initial totalNetInvestment: ${initialTotalNetInvestment.toFixed(2)}`
    );


    // ========================================================
    // 9. GET CURRENT NINE CATEGORIES
    // ========================================================

    const availableCategories =
      Object.keys(
        eroiCatChoices
      );


    const currentNineCategories =
      await getCurrentNineCategories(

        availableCategories,

        transaction

      );


    console.log(
      "\nCurrent nine categories:"
    );


    console.log(
      currentNineCategories
    );


    // ========================================================
    // 10. ARRANGE TWO SECTIONS
    // ========================================================

    const {

      sectionOne,

      sectionTwo,

    } =
      arrangeCategorySections(

        eroiCatChoices,

        currentNineCategories

      );


    console.log(
      "\nSECTION 1 - NOT IN CURRENT NINE:"
    );


    console.log(
      sectionOne
    );


    console.log(
      "\nSECTION 2 - IN CURRENT NINE:"
    );


    console.log(
      sectionTwo
    );


    // ========================================================
    // 11. PROCESS SECTION 1
    // ========================================================

    const sectionOneResult =
      await processSectionOne(

        sectionOne,

        eroiCatChoices,

        initialSumROI,

        initialTotalNetInvestment,

        meanROI,

        investmentSelections,

        transaction

      );


    // ========================================================
    // 12. CALCULATE INITIAL SUM2ROI
    // ========================================================

    const initialSum2ROI =
      calculateSectionTwoROI(

        sectionTwo,

        eroiCatChoices

      );


    console.log(
      `\nInitial sum2ROI: ${initialSum2ROI.toFixed(2)}`
    );


    // ========================================================
    // 13. PROCESS SECTION 2
    // ========================================================

    const sectionTwoResult =
      await processSectionTwo(

        sectionTwo,

        eroiCatChoices,

        sectionOneResult.sumROI,

        sectionOneResult.totalNetInvestment,

        meanROI,

        investmentSelections,

        transaction

      );


    // ========================================================
    // 14. MARK INVESTMENT SELECTIONS COMPLETED
    //
    // NO SYNCHRONIZATION
    //
    // We directly update the same records that were processed.
    // ========================================================

    await completeInvestmentSelections(

      investmentSelections,

      transaction

    );


    // ========================================================
    // 15. COMMIT EVERYTHING
    // ========================================================

    await transaction.commit();


    console.log(
      "\n=========================================="
    );

    console.log(
      "INVESTMENT OUTCOME PROCESS COMPLETED"
    );

    console.log(
      "=========================================="
    );


    // ========================================================
    // RETURN RESULTS
    // ========================================================

    return {

      groupedByCategory,

      eroiCatChoices,

      eroiCatTotal,

      initialSumROI,

      initialSum2ROI,

      meanROI,

      currentNineCategories,

      sectionOne,

      sectionTwo,

      initialTotalNetInvestment,

      finalSumROI:
        sectionTwoResult.sumROI,

      finalSum2ROI:
        sectionTwoResult.sum2ROI,

      finalTotalNetInvestment:
        sectionTwoResult.totalNetInvestment,

      switchedToHigher:
        sectionTwoResult.switchedToHigher,

      processedCategories: [

        ...sectionOneResult.processedCategories,

        ...sectionTwoResult.processedCategories,

      ],

    };


  } catch (error) {

    // ========================================================
    // ROLLBACK EVERYTHING IF ANYTHING FAILS
    // ========================================================

    await transaction.rollback();


    console.error(
      "\nERROR PROCESSING INVESTMENT OUTCOMES:"
    );


    console.error(
      error
    );


    throw error;

  }

}


module.exports =
  processInvestmentsNew;




  // ============================================================
// MAIN FUNCTION DEMO
// ============================================================

async function processDemoInvestmentsNew() {

  const transaction =
    await sequelize.transaction();


  try {

    console.log(
      "\n\n=========================================="
    );

    console.log(
      "STARTING NEW DEMOINVESTMENT OUTCOME ENGINE"
    );

    console.log(
      "=========================================="
    );


    // ========================================================
    // 1. FETCH INVESTMENT SELECTIONS
    // ========================================================

    const investmentSelections =
      await fetchUnprocessedDemoInvestmentSelections(
        transaction
      );


    // ========================================================
    // 2. IF NOTHING TO PROCESS, STOP
    // ========================================================

    if (
      investmentSelections.length === 0
    ) {

      console.log(
        "No completed InvestmentSelections require processing."
      );


      await transaction.commit();


      return null;

    }


    // ========================================================
    // 3. FLATTEN selectedInvestments
    //
    // THIS IS NOW THE SOURCE OF ALL INVESTMENTS
    // ========================================================

    const investments =
      flattenInvestmentSelections(
        investmentSelections
      );


    // ========================================================
    // 4. IF selectedInvestments ARE EMPTY
    // ========================================================

    if (
      investments.length === 0
    ) {

      console.log(
        "InvestmentSelections were found, but selectedInvestments is empty."
      );


      await transaction.commit();


      return null;

    }


    // ========================================================
    // 5. GROUP INVESTMENTS BY CATEGORY
    // ========================================================

    const groupedByCategory =
      groupInvestments(
        investments
      );


    // ========================================================
    // 6. CALCULATE EROI
    // ========================================================

    const {

      eroiCatChoices,

      eroiCatTotal,

    } =
      calculateCategoryEROIs(
        groupedByCategory
      );


    console.log(
      "\nEROI BY CATEGORY:"
    );


    console.log(
      JSON.stringify(
        eroiCatChoices,
        null,
        2
      )
    );


    // ========================================================
    // 7. CALCULATE GLOBAL SUM ROI + MEAN ROI
    // ========================================================

    const {

      sumROI: initialSumROI,

      meanROI,

    } =
      calculateGlobalROI(
        eroiCatChoices
      );


    console.log(
      `\nInitial sumROI: ${initialSumROI.toFixed(2)}`
    );


    console.log(
      `Global meanROI: ${meanROI.toFixed(2)}`
    );


    // ========================================================
    // 8. CALCULATE TOTAL NET INVESTMENT
    // ========================================================

    const initialTotalNetInvestment =
      calculateTotalNetInvestment(
        investmentSelections
      );


    console.log(
      `Initial totalNetInvestment: ${initialTotalNetInvestment.toFixed(2)}`
    );


    // ========================================================
    // 9. GET CURRENT NINE CATEGORIES
    // ========================================================

    const availableCategories =
      Object.keys(
        eroiCatChoices
      );


    const currentNineCategories =
      await getCurrentNineCategories(

        availableCategories,

        transaction

      );


    console.log(
      "\nCurrent nine categories:"
    );


    console.log(
      currentNineCategories
    );


    // ========================================================
    // 10. ARRANGE TWO SECTIONS
    // ========================================================

    const {

      sectionOne,

      sectionTwo,

    } =
      arrangeCategorySections(

        eroiCatChoices,

        currentNineCategories

      );


    console.log(
      "\nSECTION 1 - NOT IN CURRENT NINE:"
    );


    console.log(
      sectionOne
    );


    console.log(
      "\nSECTION 2 - IN CURRENT NINE:"
    );


    console.log(
      sectionTwo
    );


    // ========================================================
    // 11. PROCESS SECTION 1
    // ========================================================

    const sectionOneResult =
      await processDemoSectionOne(

        sectionOne,

        eroiCatChoices,

        initialSumROI,

        initialTotalNetInvestment,

        meanROI,

        investmentSelections,

        transaction

      );


    // ========================================================
    // 12. CALCULATE INITIAL SUM2ROI
    // ========================================================

    const initialSum2ROI =
      calculateSectionTwoROI(

        sectionTwo,

        eroiCatChoices

      );


    console.log(
      `\nInitial sum2ROI: ${initialSum2ROI.toFixed(2)}`
    );


    // ========================================================
    // 13. PROCESS SECTION 2
    // ========================================================

    const sectionTwoResult =
      await processDemoSectionTwo(

        sectionTwo,

        eroiCatChoices,

        sectionOneResult.sumROI,

        sectionOneResult.totalNetInvestment,

        meanROI,

        investmentSelections,

        transaction

      );


    // ========================================================
    // 14. MARK INVESTMENT SELECTIONS COMPLETED
    //
    // NO SYNCHRONIZATION
    //
    // We directly update the same records that were processed.
    // ========================================================

    await completeInvestmentSelections(

      investmentSelections,

      transaction

    );


    // ========================================================
    // 15. COMMIT EVERYTHING
    // ========================================================

    await transaction.commit();


    console.log(
      "\n=========================================="
    );

    console.log(
      "INVESTMENT OUTCOME PROCESS COMPLETED"
    );

    console.log(
      "=========================================="
    );


    // ========================================================
    // RETURN RESULTS
    // ========================================================

    return {

      groupedByCategory,

      eroiCatChoices,

      eroiCatTotal,

      initialSumROI,

      initialSum2ROI,

      meanROI,

      currentNineCategories,

      sectionOne,

      sectionTwo,

      initialTotalNetInvestment,

      finalSumROI:
        sectionTwoResult.sumROI,

      finalSum2ROI:
        sectionTwoResult.sum2ROI,

      finalTotalNetInvestment:
        sectionTwoResult.totalNetInvestment,

      switchedToHigher:
        sectionTwoResult.switchedToHigher,

      processedCategories: [

        ...sectionOneResult.processedCategories,

        ...sectionTwoResult.processedCategories,

      ],

    };


  } catch (error) {

    // ========================================================
    // ROLLBACK EVERYTHING IF ANYTHING FAILS
    // ========================================================

    await transaction.rollback();


    console.error(
      "\nERROR PROCESSING INVESTMENT OUTCOMES:"
    );


    console.error(
      error
    );


    throw error;

  }

}

module.exports = processDemoInvestmentsNew;


const updatePlatformFees = async (amount) => {
  const fee = Math.floor(amount * 0.05); // Calculate 5% platform fee
  const halfFee = Math.floor(fee / 2);   // Divide the fee into two equal parts

  // Update Platform Fee Schema
  const [platformFee] = await PlatformFee.findOrCreate({
    where: { type: 'main' },
    defaults: { totalFees: 0 },
  });
  platformFee.totalFees += halfFee;
  await platformFee.save();

  // Update Share Platform Fee Schema
  const [sharePlatformFee] = await SharePlatformFee.findOrCreate({
    where: { type: 'main' },
    defaults: { totalFees: 0 },
  });
  sharePlatformFee.totalFees += halfFee;
  await sharePlatformFee.save();
};

let isDistributing = false;

const distributeInvestment = async () => {

  // ==========================================================
  // PREVENT DUPLICATE / SIMULTANEOUS DISTRIBUTION
  // ==========================================================

  if (isDistributing) {

    console.warn(
      "⚠️ distributeInvestment is already running."
    );

    return;

  }

  isDistributing = true;

  const transaction =
    await sequelize.transaction();


  try {

    // ========================================================
    // STEP 1
    // FETCH INVESTMENT SELECTIONS READY FOR DISTRIBUTION
    // ========================================================

    const investmentSelections =
      await InvestmentSelection.findAll({

        where: {

          outcome: "completed",

          distributed: false,

          status: "completed",

        },

        order: [
          ["createdAt", "ASC"],
        ],

        transaction,

        lock: transaction.LOCK.UPDATE,

      });


    if (investmentSelections.length === 0) {

      console.log(
        "No InvestmentSelections to distribute."
      );

      await transaction.commit();

      return null;

    }


    console.log(
      `Found ${investmentSelections.length} InvestmentSelections to distribute.`
    );


    // ========================================================
    // STEP 2
    // CALCULATE GLOBAL TOTAL NET INVESTMENT
    //
    // totalNetInvestment =
    // SUM(amount × 0.95)
    //
    // NO ROUNDING
    // ========================================================

    let totalNetInvestment = 0;


    for (
      const selection of investmentSelections
    ) {

      const amount =
        Number(
          selection.amount || 0
        );


      const netInvestment =
        amount * 0.95;


      totalNetInvestment +=
        netInvestment;

    }


    console.log(
      `Total Net Investment Pool: ₦${totalNetInvestment}`
    );


    // ========================================================
    // STEP 3
    // CALCULATE EACH USER'S FINAL AMOUNT
    //
    // WIN:
    //     ROI is added to userWinningROI
    //
    // LOSS:
    //     ROI is added to userLosingROI
    //
    // NEUTRAL:
    //     ROI is ALSO added to userLosingROI
    //
    // NO amount IS USED HERE.
    // NO ROUNDING.
    // ========================================================

    const groupedResults = [];


    let sumWinRoi = 0;


    for (
      const selection of investmentSelections
    ) {

      const {

        investmentCode,

        userId,

        amount,

        timeframe,

        selectedInvestments,

      } = selection;


      // ------------------------------------------------------
      // SAFETY CHECK
      // ------------------------------------------------------

      if (
        !Array.isArray(
          selectedInvestments
        )
      ) {

        throw new Error(
          `selectedInvestments is not an array for ${investmentCode}`
        );

      }


      let userWinningROI = 0;

      let userLosingROI = 0;


      // ------------------------------------------------------
      // PROCESS EACH INVESTMENT INSIDE selectedInvestments
      // ------------------------------------------------------

      for (
        const investment of selectedInvestments
      ) {

        const roi =
          Number(
            investment.roi || 0
          );


        // ----------------------------------------------------
        // WIN
        // ----------------------------------------------------

        if (
          investment.outcome === "win"
        ) {

          userWinningROI +=
            roi;

          sumWinRoi +=
            roi;

        }


        // ----------------------------------------------------
        // LOSS OR NEUTRAL
        //
        // NEUTRAL IS TREATED EXACTLY LIKE LOSS.
        // ----------------------------------------------------

        else if (
          investment.outcome === "loss" ||
          investment.outcome === "neutral"
        ) {

          userLosingROI +=
            roi;

        }


        // ----------------------------------------------------
        // INVALID OUTCOME
        // ----------------------------------------------------

        else {

          throw new Error(
            `Investment ${
              investment.category || "unknown"
            } in ${
              investmentCode
            } has invalid outcome: ${
              investment.outcome
            }`
          );

        }

      }


      // ------------------------------------------------------
      // USER FINAL AMOUNT
      //
      // NO ROUNDING
      //
      // finalAmount =
      // winning ROI - losing ROI
      //
      // Neutral ROI is already included in losing ROI.
      // ------------------------------------------------------

      const finalAmount =
        userWinningROI -
        userLosingROI;


      groupedResults.push({

        groupCode:
          investmentCode,

        userId,

        timeframe,

        investmentAmount:
          Number(amount),

        userWinningROI,

        userLosingROI,

        finalAmount,

        ratioAmount: 0,

        leftoverShare: 0,

        distributedAmount: 0,

        totalNetInvestment: 0,

        createdAt:
          new Date(),

      });

    }


    console.log(
      `Total Winning ROI: ₦${sumWinRoi}`
    );


    // ========================================================
    // STEP 4
    // CALCULATE LEFTOVER FUND
    //
    // leftOverFund =
    // totalNetInvestment - sumWinRoi
    //
    // NO ROUNDING
    // ========================================================

    let leftOverFund =
      totalNetInvestment -
      sumWinRoi;


    // --------------------------------------------------------
    // SAFETY:
    // THE POOL MUST NEVER BECOME NEGATIVE.
    //
    // This is not rounding.
    // It is a business-rule floor at zero.
    // --------------------------------------------------------

    if (
      leftOverFund < 0
    ) {

      console.warn(
        `⚠️ Winning ROI exceeds the investment pool by ₦${Math.abs(leftOverFund)}`
      );

      leftOverFund = 0;

    }


    console.log(
      `Left Over Fund: ₦${leftOverFund}`
    );


    // ========================================================
    // STEP 5
    // FIND LOWEST FINAL AMOUNT
    // ========================================================

    let lowestFinalAmount =
      Infinity;


    for (
      const group of groupedResults
    ) {

      if (
        group.finalAmount <
        lowestFinalAmount
      ) {

        lowestFinalAmount =
          group.finalAmount;

      }

    }


    // ========================================================
    // STEP 6
    // CREATE POSITIVE RATIO AMOUNTS
    //
    // If lowest finalAmount is negative:
    //
    // ratioShift =
    // abs(lowestFinalAmount) + 1
    //
    // Otherwise:
    // ratioShift = 0
    //
    // NO ROUNDING.
    // ========================================================

    let ratioShift = 0;


    if (
      lowestFinalAmount < 0
    ) {

      ratioShift =
        Math.abs(
          lowestFinalAmount
        ) + 1;

    }


    console.log(
      `Lowest Final Amount: ₦${lowestFinalAmount}`
    );

    console.log(
      `Ratio Shift: ₦${ratioShift}`
    );


    let totalRatioAmount = 0;


    for (
      const group of groupedResults
    ) {

      group.ratioAmount =
        group.finalAmount +
        ratioShift;


      totalRatioAmount +=
        group.ratioAmount;

    }


    console.log(
      `Total Ratio Amount: ₦${totalRatioAmount}`
    );


    // ========================================================
    // STEP 7
    // DISTRIBUTE LEFTOVER FUND ACCORDING TO RATIO AMOUNT
    //
    // NO ROUNDING.
    // ========================================================

    for (
      const group of groupedResults
    ) {

      let leftoverShare = 0;


      if (
        leftOverFund > 0 &&
        totalRatioAmount > 0
      ) {

        leftoverShare =
          (
            group.ratioAmount /
            totalRatioAmount
          ) *
          leftOverFund;

      }


      group.leftoverShare =
        leftoverShare;


      // ------------------------------------------------------
      // FINAL AMOUNT THAT WILL ACTUALLY BE DISTRIBUTED
      //
      // Winning ROI + leftover share
      //
      // NO ROUNDING.
      // ------------------------------------------------------

      group.distributedAmount =
        group.userWinningROI +
        group.leftoverShare;


      // ------------------------------------------------------
      // GLOBAL POOL ATTACHED TO DISTRIBUTION RECORD
      // ------------------------------------------------------

      group.totalNetInvestment =
        totalNetInvestment;

    }


    // ========================================================
    // STEP 8
    // SAVE GROUPED INVESTMENTS
    // AND UPDATE USER BALANCES
    // ========================================================

    for (
      const group of groupedResults
    ) {

      // ------------------------------------------------------
      // SAVE / UPDATE GROUPED INVESTMENT
      // ------------------------------------------------------

      const existingGroup =
        await GroupedInvestment.findOne({

          where: {

            groupCode:
              group.groupCode,

          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,

        });


      if (!existingGroup) {

        await GroupedInvestment.create(

          {

            groupCode:
              group.groupCode,

            userId:
              group.userId,

            timeframe:
              group.timeframe,

            investmentAmount:
              group.investmentAmount,

            totalNetInvestment:
              group.totalNetInvestment,

            adjustedNetInvestment:
              group.distributedAmount,

            share:
              group.distributedAmount,

            createdAt:
              group.createdAt,

          },

          {
            transaction,
          }

        );

      }

      else {

        await existingGroup.update(

          {

            userId:
              group.userId,

            timeframe:
              group.timeframe,

            investmentAmount:
              group.investmentAmount,

            totalNetInvestment:
              group.totalNetInvestment,

            adjustedNetInvestment:
              group.distributedAmount,

            share:
              group.distributedAmount,

          },

          {
            transaction,
          }

        );

      }


      // ------------------------------------------------------
      // ADD DISTRIBUTED AMOUNT TO USER BALANCE
      // ------------------------------------------------------

      await User.increment(

        {
          balance:
            group.distributedAmount,
        },

        {
          where: {

            userId:
              group.userId,

          },

          transaction,
        }

      );


      // ------------------------------------------------------
      // LOG
      // ------------------------------------------------------

      console.log(
        `\n✅ Distributed ${group.groupCode}`
      );

      console.log(
        `User: ${group.userId}`
      );

      console.log(
        `Winning ROI: ₦${group.userWinningROI}`
      );

      console.log(
        `Losing ROI: ₦${group.userLosingROI}`
      );

      console.log(
        `Final Amount: ₦${group.finalAmount}`
      );

      console.log(
        `Ratio Amount: ₦${group.ratioAmount}`
      );

      console.log(
        `Leftover Share: ₦${group.leftoverShare}`
      );

      console.log(
        `Distributed Amount: ₦${group.distributedAmount}`
      );

    }


    // ========================================================
    // STEP 9
    // MARK INVESTMENT SELECTIONS AS DISTRIBUTED
    // ========================================================

    const investmentCodes =
      investmentSelections.map(
        selection =>
          selection.investmentCode
      );


    await InvestmentSelection.update(

      {
        distributed: true,
      },

      {
        where: {

          investmentCode: {
            [Op.in]:
              investmentCodes,
          },

        },

        transaction,
      }

    );


    // ========================================================
    // STEP 10
    // COMMIT TRANSACTION
    // ========================================================

    await transaction.commit();


    console.log(
      "\n================================================"
    );

    console.log(
      "✅ INVESTMENT DISTRIBUTION COMPLETED"
    );

    console.log(
      "================================================"
    );

    console.log(
      `Selections Processed: ${investmentSelections.length}`
    );

    console.log(
      `Total Net Investment: ₦${totalNetInvestment}`
    );

    console.log(
      `Total Winning ROI: ₦${sumWinRoi}`
    );

    console.log(
      `Left Over Fund: ₦${leftOverFund}`
    );

    console.log(
      `Total Ratio Amount: ₦${totalRatioAmount}`
    );


    // ========================================================
    // RETURN RESULT
    // ========================================================

    return {

      processed:
        investmentSelections.length,

      totalNetInvestment,

      sumWinRoi,

      leftOverFund,

      lowestFinalAmount,

      ratioShift,

      totalRatioAmount,

      distributions:
        groupedResults.map(
          group => ({

            groupCode:
              group.groupCode,

            userId:
              group.userId,

            investmentAmount:
              group.investmentAmount,

            winningROI:
              group.userWinningROI,

            losingROI:
              group.userLosingROI,

            finalAmount:
              group.finalAmount,

            ratioAmount:
              group.ratioAmount,

            leftoverShare:
              group.leftoverShare,

            distributedAmount:
              group.distributedAmount,

          })
        ),

    };


  } catch (error) {

    // ========================================================
    // ROLLBACK EVERYTHING
    // ========================================================

    await transaction.rollback();

    console.error(
      "❌ Distribution Error:",
      error
    );

    throw error;


  } finally {

    isDistributing = false;

  }

};

let isDemoDistributing = false;

const distributeDemoInvestment = async () => {

  // ==========================================================
  // PREVENT DUPLICATE / SIMULTANEOUS DISTRIBUTION
  // ==========================================================

  if (isDemoDistributing) {

    console.warn(
      "⚠️ distributeDemoInvestment is already running."
    );

    return;

  }

  isDemoDistributing = true;

  const transaction =
    await sequelize.transaction();


  try {

    // ========================================================
    // STEP 1
    // FETCH INVESTMENT SELECTIONS READY FOR DISTRIBUTION
    // ========================================================

    const investmentSelections =
      await InvestmentSelectionDemo.findAll({

        where: {

          outcome: "completed",

          distributed: false,

          status: "completed",

        },

        order: [
          ["createdAt", "ASC"],
        ],

        transaction,

        lock: transaction.LOCK.UPDATE,

      });


    if (investmentSelections.length === 0) {

      console.log(
        "No InvestmentSelections to distribute."
      );

      await transaction.commit();

      return null;

    }


    console.log(
      `Found ${investmentSelections.length} InvestmentSelections to distribute.`
    );


    // ========================================================
    // STEP 2
    // CALCULATE GLOBAL TOTAL NET INVESTMENT
    //
    // totalNetInvestment =
    // SUM(amount × 0.95)
    //
    // NO ROUNDING
    // ========================================================

    let totalNetInvestment = 0;


    for (
      const selection of investmentSelections
    ) {

      const amount =
        Number(
          selection.amount || 0
        );


      const netInvestment =
        amount * 0.95;


      totalNetInvestment +=
        netInvestment;

    }


    console.log(
      `Total Net Investment Pool: ₦${totalNetInvestment}`
    );


    // ========================================================
    // STEP 3
    // CALCULATE EACH USER'S FINAL AMOUNT
    //
    // WIN:
    //     ROI is added to userWinningROI
    //
    // LOSS:
    //     ROI is added to userLosingROI
    //
    // NEUTRAL:
    //     ROI is ALSO added to userLosingROI
    //
    // NO amount IS USED HERE.
    // NO ROUNDING.
    // ========================================================

    const groupedResults = [];


    let sumWinRoi = 0;


    for (
      const selection of investmentSelections
    ) {

      const {

        investmentCode,

        userId,

        amount,

        timeframe,

        selectedInvestments,

      } = selection;


      // ------------------------------------------------------
      // SAFETY CHECK
      // ------------------------------------------------------

      if (
        !Array.isArray(
          selectedInvestments
        )
      ) {

        throw new Error(
          `selectedInvestments is not an array for ${investmentCode}`
        );

      }


      let userWinningROI = 0;

      let userLosingROI = 0;


      // ------------------------------------------------------
      // PROCESS EACH INVESTMENT INSIDE selectedInvestments
      // ------------------------------------------------------

      for (
        const investment of selectedInvestments
      ) {

        const roi =
          Number(
            investment.roi || 0
          );


        // ----------------------------------------------------
        // WIN
        // ----------------------------------------------------

        if (
          investment.outcome === "win"
        ) {

          userWinningROI +=
            roi;

          sumWinRoi +=
            roi;

        }


        // ----------------------------------------------------
        // LOSS OR NEUTRAL
        //
        // NEUTRAL IS TREATED EXACTLY LIKE LOSS.
        // ----------------------------------------------------

        else if (
          investment.outcome === "loss" ||
          investment.outcome === "neutral"
        ) {

          userLosingROI +=
            roi;

        }


        // ----------------------------------------------------
        // INVALID OUTCOME
        // ----------------------------------------------------

        else {

          throw new Error(
            `Investment ${
              investment.category || "unknown"
            } in ${
              investmentCode
            } has invalid outcome: ${
              investment.outcome
            }`
          );

        }

      }


      // ------------------------------------------------------
      // USER FINAL AMOUNT
      //
      // NO ROUNDING
      //
      // finalAmount =
      // winning ROI - losing ROI
      //
      // Neutral ROI is already included in losing ROI.
      // ------------------------------------------------------

      const finalAmount =
        userWinningROI -
        userLosingROI;


      groupedResults.push({

        groupCode:
          investmentCode,

        userId,

        timeframe,

        investmentAmount:
          Number(amount),

        userWinningROI,

        userLosingROI,

        finalAmount,

        ratioAmount: 0,

        leftoverShare: 0,

        distributedAmount: 0,

        totalNetInvestment: 0,

        createdAt:
          new Date(),

      });

    }


    console.log(
      `Total Winning ROI: ₦${sumWinRoi}`
    );


    // ========================================================
    // STEP 4
    // CALCULATE LEFTOVER FUND
    //
    // leftOverFund =
    // totalNetInvestment - sumWinRoi
    //
    // NO ROUNDING
    // ========================================================

    let leftOverFund =
      totalNetInvestment -
      sumWinRoi;


    // --------------------------------------------------------
    // SAFETY:
    // THE POOL MUST NEVER BECOME NEGATIVE.
    //
    // This is not rounding.
    // It is a business-rule floor at zero.
    // --------------------------------------------------------

    if (
      leftOverFund < 0
    ) {

      console.warn(
        `⚠️ Winning ROI exceeds the investment pool by ₦${Math.abs(leftOverFund)}`
      );

      leftOverFund = 0;

    }


    console.log(
      `Left Over Fund: ₦${leftOverFund}`
    );


    // ========================================================
    // STEP 5
    // FIND LOWEST FINAL AMOUNT
    // ========================================================

    let lowestFinalAmount =
      Infinity;


    for (
      const group of groupedResults
    ) {

      if (
        group.finalAmount <
        lowestFinalAmount
      ) {

        lowestFinalAmount =
          group.finalAmount;

      }

    }


    // ========================================================
    // STEP 6
    // CREATE POSITIVE RATIO AMOUNTS
    //
    // If lowest finalAmount is negative:
    //
    // ratioShift =
    // abs(lowestFinalAmount) + 1
    //
    // Otherwise:
    // ratioShift = 0
    //
    // NO ROUNDING.
    // ========================================================

    let ratioShift = 0;


    if (
      lowestFinalAmount < 0
    ) {

      ratioShift =
        Math.abs(
          lowestFinalAmount
        ) + 1;

    }


    console.log(
      `Lowest Final Amount: ₦${lowestFinalAmount}`
    );

    console.log(
      `Ratio Shift: ₦${ratioShift}`
    );


    let totalRatioAmount = 0;


    for (
      const group of groupedResults
    ) {

      group.ratioAmount =
        group.finalAmount +
        ratioShift;


      totalRatioAmount +=
        group.ratioAmount;

    }


    console.log(
      `Total Ratio Amount: ₦${totalRatioAmount}`
    );


    // ========================================================
    // STEP 7
    // DISTRIBUTE LEFTOVER FUND ACCORDING TO RATIO AMOUNT
    //
    // NO ROUNDING.
    // ========================================================

    for (
      const group of groupedResults
    ) {

      let leftoverShare = 0;


      if (
        leftOverFund > 0 &&
        totalRatioAmount > 0
      ) {

        leftoverShare =
          (
            group.ratioAmount /
            totalRatioAmount
          ) *
          leftOverFund;

      }


      group.leftoverShare =
        leftoverShare;


      // ------------------------------------------------------
      // FINAL AMOUNT THAT WILL ACTUALLY BE DISTRIBUTED
      //
      // Winning ROI + leftover share
      //
      // NO ROUNDING.
      // ------------------------------------------------------

      group.distributedAmount =
        group.userWinningROI +
        group.leftoverShare;


      // ------------------------------------------------------
      // GLOBAL POOL ATTACHED TO DISTRIBUTION RECORD
      // ------------------------------------------------------

      group.totalNetInvestment =
        totalNetInvestment;

    }


    // ========================================================
    // STEP 8
    // SAVE GROUPED INVESTMENTS
    // AND UPDATE USER BALANCES
    // ========================================================

    for (
      const group of groupedResults
    ) {

      // ------------------------------------------------------
      // SAVE / UPDATE GROUPED INVESTMENT
      // ------------------------------------------------------

      const existingGroup =
        await GroupedDemoInvestment.findOne({

          where: {

            groupCode:
              group.groupCode,

          },

          transaction,

          lock:
            transaction.LOCK.UPDATE,

        });


      if (!existingGroup) {

        await GroupedDemoInvestment.create(

          {

            groupCode:
              group.groupCode,

            userId:
              group.userId,

            timeframe:
              group.timeframe,

            investmentAmount:
              group.investmentAmount,

            totalNetInvestment:
              group.totalNetInvestment,

            adjustedNetInvestment:
              group.distributedAmount,

            share:
              group.distributedAmount,

            createdAt:
              group.createdAt,

          },

          {
            transaction,
          }

        );

      }

      else {

        await existingGroup.update(

          {

            userId:
              group.userId,

            timeframe:
              group.timeframe,

            investmentAmount:
              group.investmentAmount,

            totalNetInvestment:
              group.totalNetInvestment,

            adjustedNetInvestment:
              group.distributedAmount,

            share:
              group.distributedAmount,

          },

          {
            transaction,
          }

        );

      }


      // ------------------------------------------------------
      // ADD DISTRIBUTED AMOUNT TO USER BALANCE
      // ------------------------------------------------------

      await User.increment(

        {
          demoBalance:
            group.distributedAmount,
        },

        {
          where: {

            userId:
              group.userId,

          },

          transaction,
        }

      );


      // ------------------------------------------------------
      // LOG
      // ------------------------------------------------------

      console.log(
        `\n✅ Distributed ${group.groupCode}`
      );

      console.log(
        `User: ${group.userId}`
      );

      console.log(
        `Winning ROI: ₦${group.userWinningROI}`
      );

      console.log(
        `Losing ROI: ₦${group.userLosingROI}`
      );

      console.log(
        `Final Amount: ₦${group.finalAmount}`
      );

      console.log(
        `Ratio Amount: ₦${group.ratioAmount}`
      );

      console.log(
        `Leftover Share: ₦${group.leftoverShare}`
      );

      console.log(
        `Distributed Amount: ₦${group.distributedAmount}`
      );

    }


    // ========================================================
    // STEP 9
    // MARK INVESTMENT SELECTIONS AS DISTRIBUTED
    // ========================================================

    const investmentCodes =
      investmentSelections.map(
        selection =>
          selection.investmentCode
      );


    await InvestmentSelectionDemo.update(

      {
        distributed: true,
      },

      {
        where: {

          investmentCode: {
            [Op.in]:
              investmentCodes,
          },

        },

        transaction,
      }

    );


    // ========================================================
    // STEP 10
    // COMMIT TRANSACTION
    // ========================================================

    await transaction.commit();


    console.log(
      "\n================================================"
    );

    console.log(
      "✅ INVESTMENT DISTRIBUTION COMPLETED"
    );

    console.log(
      "================================================"
    );

    console.log(
      `Selections Processed: ${investmentSelections.length}`
    );

    console.log(
      `Total Net Investment: ₦${totalNetInvestment}`
    );

    console.log(
      `Total Winning ROI: ₦${sumWinRoi}`
    );

    console.log(
      `Left Over Fund: ₦${leftOverFund}`
    );

    console.log(
      `Total Ratio Amount: ₦${totalRatioAmount}`
    );


    // ========================================================
    // RETURN RESULT
    // ========================================================

    return {

      processed:
        investmentSelections.length,

      totalNetInvestment,

      sumWinRoi,

      leftOverFund,

      lowestFinalAmount,

      ratioShift,

      totalRatioAmount,

      distributions:
        groupedResults.map(
          group => ({

            groupCode:
              group.groupCode,

            userId:
              group.userId,

            investmentAmount:
              group.investmentAmount,

            winningROI:
              group.userWinningROI,

            losingROI:
              group.userLosingROI,

            finalAmount:
              group.finalAmount,

            ratioAmount:
              group.ratioAmount,

            leftoverShare:
              group.leftoverShare,

            distributedAmount:
              group.distributedAmount,

          })
        ),

    };


  } catch (error) {

    // ========================================================
    // ROLLBACK EVERYTHING
    // ========================================================

    await transaction.rollback();

    console.error(
      "❌ Distribution Error:",
      error
    );

    throw error;


  } finally {

    isDemoDistributing = false;

  }

};



router.get('/process', async (req, res) => {

  try {

    // =====================================================
    // STEP 1
    // PROCESS INVESTMENT OUTCOMES
    // =====================================================

    const result =
      await processInvestmentsNew();
      await processDemoInvestmentsNew();
    // =====================================================
    // STEP 2
    // DISTRIBUTE NORMAL INVESTMENTS
    // =====================================================

    const distributionResult =
      await distributeInvestment();
      await distributeDemoInvestment();

    // =====================================================
    // STEP 4
    // SEND ONE RESPONSE ONLY
    // =====================================================

    return res.status(200).json({

      success: true,

      message:
        'Outcome processing, distribution, and user balances updated successfully.',

      result,

      distributionResult,

    });


  } catch (error) {

    // =====================================================
    // ERROR HANDLING
    // =====================================================

    console.error(
      'Error during processing:',
      error
    );


    return res.status(500).json({

      success: false,

      message:
        'An error occurred during processing.',

      error:
        error.message,

    });

  }

});




router.post('/update-platform-fee', async (req, res) => {
  try {
    const { investmentAmount } = req.body;
    if (!investmentAmount || investmentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    await updatePlatformFees(investmentAmount);

    // Retrieve updated platform fees
    const platformFee = await PlatformFee.findOne({ where: { type: 'main' } });
    const sharePlatformFee = await SharePlatformFee.findOne({ where: { type: 'main' } });

    res.status(200).json({ 
      message: 'Platform fee updated successfully', 
      platformFees: platformFee.totalFees,
      sharePlatformFees: sharePlatformFee.totalFees 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating platform fees' });
  }
});

// Endpoint to get platform fees
router.get('/platform-fees', async (req, res) => {
  try {
    const platformFee = await PlatformFee.findOne();
    res.status(200).json({ totalFees: platformFee ? platformFee.totalFees : 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving platform fees' });
  }
});

const distributePlatformFees = async () => {
  try {
    console.log("⏳ Running scheduled platform fee distribution...");

    const sharePlatformFee = await SharePlatformFee.findOne();
    if (!sharePlatformFee || sharePlatformFee.totalFees <= 0) {
      console.log("⚠️ No fees available for distribution.");
      return;
    }

    const totalFees = sharePlatformFee.totalFees;

    const members = await Member.findAll();
    if (members.length === 0) {
      console.log("⚠️ No members found.");
      return;
    }

    const updatePromises = members.map(async (member) => {
      let memberShare = ((member.sharePercentage / 100) * totalFees).toFixed(3);
      memberShare = parseFloat(memberShare);

      console.log(`✅ Allocating ${memberShare} to ${member.name}`);

      // Increment shareBalance using Sequelize's increment method
      return member.increment('shareBalance', { by: memberShare });
    });

    await Promise.all(updatePromises);

    // Reset totalFees to 0
    await sharePlatformFee.update({ totalFees: 0 });

    console.log("✅ Platform fees distributed and reset to 0.");
  } catch (error) {
    console.error("❌ Error distributing platform fees:", error);
  }
};


module.exports = router;