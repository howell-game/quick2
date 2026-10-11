
const express = require("express");
const sequelize = require("../db");
const {
  LessonNote,
  LessonNotePeriod,
} = require("../models/lessonNoteAssociations");

const router = express.Router();

const validTerms = [
  "First Term",
  "Second Term",
  "Third Term",
];

function textValue(value) {
  return value == null ? "" : String(value).trim();
}

function validateLesson(body) {
  const requiredFields = [
    "academicSession",
    "term",
    "className",
    "subject",
    "weekNumber",
    "topic",
  ];

  for (const field of requiredFields) {
    if (textValue(body[field]) === "") {
      return `${field} is required.`;
    }
  }

  if (!validTerms.includes(body.term)) {
    return "Invalid term.";
  }

  const weekNumber = Number(body.weekNumber);

  if (
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > 60
  ) {
    return "Week number must be a whole number between 1 and 60.";
  }

  // General Lesson Content arrays must be supplied.
  const requiredArrays = [
    ["objectives", "Objectives"],
    ["content", "Lesson content"],
    ["activities", "Activities"],
    ["evaluation", "Evaluation"],
  ];

  for (const [field, label] of requiredArrays) {
    if (
      !Array.isArray(body[field]) ||
      body[field].filter((item) => textValue(item) !== "").length === 0
    ) {
      return `${label} must contain at least one item.`;
    }
  }

  // These General Lesson Content fields are mandatory.
  if (!textValue(body.materials)) {
    return "Instructional materials are required.";
  }

  if (!textValue(body.previousKnowledge)) {
    return "Previous knowledge is required.";
  }

  if (!textValue(body.assignment)) {
    return "Assignment is required.";
  }

  // Exactly four period records are retained, but their fields are optional.
  if (!Array.isArray(body.periods) || body.periods.length !== 4) {
    return "Exactly four lesson periods are required.";
  }

  const periodNumbers = body.periods.map((period) =>
    Number(period.periodNumber)
  );

  if (
    periodNumbers.some((number) => !Number.isInteger(number)) ||
    [...periodNumbers].sort((a, b) => a - b).join(",") !== "1,2,3,4"
  ) {
    return "Periods 1, 2, 3 and 4 must each appear exactly once.";
  }

  for (const period of body.periods) {
    const duration = period.duration;

    // An empty duration is allowed. A supplied duration must be valid.
    if (
      duration !== null &&
      duration !== undefined &&
      duration !== "" &&
      (!Number.isInteger(Number(duration)) ||
        Number(duration) < 1 ||
        Number(duration) > 300)
    ) {
      return `Period ${period.periodNumber} duration must be a whole number between 1 and 300.`;
    }

    // Empty titles, activities, lesson content and speed work are allowed.
    if (
      period.speedWork !== undefined &&
      !Array.isArray(period.speedWork)
    ) {
      return `Period ${period.periodNumber} speed work must be an array.`;
    }
  }

  return null;
}

function buildPeriod(period, lessonNoteId) {
  const duration =
    period.duration === null ||
    period.duration === undefined ||
    period.duration === ""
      ? null
      : Number(period.duration);

  return {
    lessonNoteId,
    periodNumber: Number(period.periodNumber),
    title: textValue(period.title),
    duration,
    teacherActivities: textValue(period.teacherActivities),
    studentActivities: textValue(period.studentActivities),
    lessonContent: textValue(period.lessonContent),
    speedWork: Array.isArray(period.speedWork)
      ? period.speedWork
          .map((item) => textValue(item))
          .filter(Boolean)
      : [],
    conclusion: textValue(period.conclusion),
  };
}

function buildLessonNotePayload(body) {
  return {
    academicSession: textValue(body.academicSession),
    term: body.term,
    className: textValue(body.className),
    subject: textValue(body.subject),
    weekNumber: Number(body.weekNumber),
    topic: textValue(body.topic),
    objectives: body.objectives.map((item) => textValue(item)).filter(Boolean),
    materials: textValue(body.materials),
    previousKnowledge: textValue(body.previousKnowledge),
    content: body.content.map((item) => textValue(item)).filter(Boolean),
    activities: body.activities.map((item) => textValue(item)).filter(Boolean),
    evaluation: body.evaluation.map((item) => textValue(item)).filter(Boolean),
    assignment: textValue(body.assignment),
  };
}

async function findLessonWithPeriods(id, options = {}) {
  return LessonNote.findByPk(id, {
    ...options,
    include: [
      {
        model: LessonNotePeriod,
        as: "periods",
      },
    ],
    order: [
      [
        { model: LessonNotePeriod, as: "periods" },
        "periodNumber",
        "ASC",
      ],
    ],
  });
}

// GET all matching weekly lesson notes.
router.get("/", async (req, res) => {
  try {
    const {
      academicSession,
      term,
      className,
      subject,
    } = req.query;

    const where = {};

    if (academicSession) where.academicSession = academicSession;
    if (term) where.term = term;
    if (className) where.className = className;
    if (subject) where.subject = subject;

    const notes = await LessonNote.findAll({
      where,
      attributes: [
        "id",
        "academicSession",
        "term",
        "className",
        "subject",
        "weekNumber",
        "topic",
      ],
      order: [["weekNumber", "ASC"]],
    });

    return res.json({
      success: true,
      lessonNotes: notes,
    });
  } catch (error) {
    console.error("Fetch lesson notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch lesson notes.",
    });
  }
});

// GET one lesson note with all four periods.
router.get("/:id", async (req, res) => {
  try {
    const note = await findLessonWithPeriods(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Lesson note not found.",
      });
    }

    return res.json({
      success: true,
      lessonNote: note,
    });
  } catch (error) {
    console.error("Fetch lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch this lesson note.",
    });
  }
});

// CREATE a lesson note and its four period records.
router.post("/", async (req, res) => {
  const validationError = validateLesson(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const note = await LessonNote.create(
      buildLessonNotePayload(req.body),
      { transaction }
    );

    await LessonNotePeriod.bulkCreate(
      req.body.periods.map((period) => buildPeriod(period, note.id)),
      { transaction }
    );

    await transaction.commit();
    transaction = null;

    const savedNote = await findLessonWithPeriods(note.id);

    return res.status(201).json({
      success: true,
      message: "Lesson note created successfully.",
      lessonNote: savedNote,
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Create lesson note rollback error:", rollbackError);
      }
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message:
          "A lesson note already exists for this session, term, class, subject and week.",
      });
    }

    console.error("Create lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the lesson note.",
    });
  }
});

// UPDATE an existing lesson note and replace its four period records.
router.put("/:id", async (req, res) => {
  const validationError = validateLesson(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const note = await LessonNote.findByPk(req.params.id, {
      transaction,
    });

    if (!note) {
      await transaction.rollback();
      transaction = null;

      return res.status(404).json({
        success: false,
        message: "Lesson note not found.",
      });
    }

    await note.update(buildLessonNotePayload(req.body), {
      transaction,
    });

    await LessonNotePeriod.destroy({
      where: { lessonNoteId: note.id },
      transaction,
    });

    await LessonNotePeriod.bulkCreate(
      req.body.periods.map((period) => buildPeriod(period, note.id)),
      { transaction }
    );

    await transaction.commit();
    transaction = null;

    const savedNote = await findLessonWithPeriods(note.id);

    return res.json({
      success: true,
      message: "Lesson note updated successfully.",
      lessonNote: savedNote,
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Update lesson note rollback error:", rollbackError);
      }
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message:
          "Another lesson note already uses this session, term, class, subject and week.",
      });
    }

    console.error("Update lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the lesson note.",
    });
  }
});

module.exports = router;
