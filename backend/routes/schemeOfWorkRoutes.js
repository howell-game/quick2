
const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();

const sequelize = require("../db");
const SchemeOfWork = require("../models/SchemeOfWork");
const SchemeOfWorkWeek = require("../models/SchemeOfWorkWeek");

const ALLOWED_TERMS = [
  "First Term",
  "Second Term",
  "Third Term"
];

function validateSchemeDetails({
  academicSession,
  term,
  className,
  subject
}) {
  if (
    typeof academicSession !== "string" ||
    !academicSession.trim() ||
    academicSession.trim().length > 20
  ) {
    return "Please provide a valid academic session.";
  }

  if (!ALLOWED_TERMS.includes(term)) {
    return "Please select a valid term.";
  }

  if (
    typeof className !== "string" ||
    !className.trim() ||
    className.trim().length > 30
  ) {
    return "Please provide a valid class.";
  }

  if (
    typeof subject !== "string" ||
    !subject.trim() ||
    subject.trim().length > 100
  ) {
    return "Please provide a valid subject.";
  }

  return null;
}

function validateWeeks(weeks) {
  if (!Array.isArray(weeks) || weeks.length < 1 || weeks.length > 60) {
    return "Please provide between 1 and 60 weekly entries.";
  }

  const usedWeekNumbers = new Set();

  for (const item of weeks) {
    if (
      !item ||
      !Number.isInteger(Number(item.week)) ||
      Number(item.week) < 1 ||
      Number(item.week) > 60
    ) {
      return "Every week must have a valid number from 1 to 60.";
    }

    const weekNumber = Number(item.week);

    if (usedWeekNumbers.has(weekNumber)) {
      return `Week ${weekNumber} appears more than once.`;
    }

    usedWeekNumbers.add(weekNumber);

    for (const field of [
      "topic",
      "objectives",
      "activities",
      "evaluation"
    ]) {
      if (
        typeof item[field] !== "string" ||
        !item[field].trim()
      ) {
        return `Please complete ${field} for Week ${weekNumber}.`;
      }
    }

    if (item.topic.trim().length > 255) {
      return `The topic for Week ${weekNumber} must not exceed 255 characters.`;
    }
  }

  return null;
}

// ======================================================
// GET A SAVED SCHEME OF WORK
// GET /api/schemes-of-work
// ======================================================
router.get("/", async (req, res) => {
  try {
    const {
      term,
      class: className,
      subject,
      academicSession
    } = req.query;

    if (!term || !className || !subject || !academicSession) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide term, class, subject and academicSession."
      });
    }

    const scheme = await SchemeOfWork.findOne({
      where: {
        term,
        className,
        subject,
        academicSession
      }
    });

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message:
          "No scheme of work was found for the selected details."
      });
    }

    const weeks = await SchemeOfWorkWeek.findAll({
      where: { schemeId: scheme.id },
      order: [["week", "ASC"]],
      attributes: [
        "id",
        "week",
        "topic",
        "objectives",
        "activities",
        "evaluation"
      ]
    });

    return res.status(200).json({
      success: true,
      scheme: {
        id: scheme.id,
        academicSession: scheme.academicSession,
        term: scheme.term,
        class: scheme.className,
        subject: scheme.subject
      },
      weeks
    });
  } catch (error) {
    console.error("Error fetching scheme of work:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch the scheme of work."
    });
  }
});

// ======================================================
// CREATE A NEW SCHEME OF WORK
// POST /api/schemes-of-work
// ======================================================
router.post("/", async (req, res) => {
  let transaction;

  try {
    const {
      academicSession,
      term,
      className,
      subject,
      weeks
    } = req.body || {};

    const normalizedDetails = {
      academicSession:
        typeof academicSession === "string"
          ? academicSession.trim()
          : academicSession,
      term,
      className:
        typeof className === "string"
          ? className.trim()
          : className,
      subject:
        typeof subject === "string"
          ? subject.trim()
          : subject
    };

    const detailsError = validateSchemeDetails(normalizedDetails);

    if (detailsError) {
      return res.status(400).json({
        success: false,
        message: detailsError
      });
    }

    const weeksError = validateWeeks(weeks);

    if (weeksError) {
      return res.status(400).json({
        success: false,
        message: weeksError
      });
    }

    // Check for an existing scheme before starting the transaction.
    const existingScheme = await SchemeOfWork.findOne({
      where: normalizedDetails
    });

    if (existingScheme) {
      return res.status(409).json({
        success: false,
        message:
          "A scheme already exists for this academic session, term, class and subject."
      });
    }

    transaction = await sequelize.transaction();

    // Save the main scheme record.
    const scheme = await SchemeOfWork.create(
      normalizedDetails,
      { transaction }
    );

    // Save all weekly entries against the new scheme.
    const weeklyRows = weeks.map((item) => ({
      schemeId: scheme.id,
      week: Number(item.week),
      topic: item.topic.trim(),
      objectives: item.objectives.trim(),
      activities: item.activities.trim(),
      evaluation: item.evaluation.trim()
    }));

    await SchemeOfWorkWeek.bulkCreate(weeklyRows, {
      transaction,
      validate: true
    });

    await transaction.commit();
    transaction = null;

    return res.status(201).json({
      success: true,
      message: "Scheme of work saved successfully.",
      scheme: {
        id: scheme.id,
        academicSession: scheme.academicSession,
        term: scheme.term,
        class: scheme.className,
        subject: scheme.subject
      },
      weeksSaved: weeklyRows.length
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Scheme transaction rollback failed:", rollbackError);
      }
    }

    // The database's unique constraint also protects against
    // two simultaneous requests creating the same scheme.
    if (
      error.name === "SequelizeUniqueConstraintError" ||
      error.name === "SequelizeExclusionConstraintError"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A scheme or weekly entry with these details already exists."
      });
    }

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeForeignKeyConstraintError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The submitted scheme contains invalid information."
      });
    }

    console.error("Error saving scheme of work:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the scheme of work."
    });
  }
});

module.exports = router;
