
const express = require("express");
const { Op } = require("sequelize");
const sequelize = require("../db");
const {
  LessonNote,
  LessonNotePeriod
} = require("../models/lessonNoteAssociations");

const router = express.Router();

const validTerms = [
  "First Term",
  "Second Term",
  "Third Term"
];

function validateLesson(body) {
  const requiredFields = [
    "academicSession",
    "term",
    "className",
    "subject",
    "weekNumber",
    "topic"
  ];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      String(body[field]).trim() === ""
    ) {
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
    return "Week number must be between 1 and 60.";
  }

  if (!Array.isArray(body.objectives)) {
    return "Objectives must be an array.";
  }

  if (!Array.isArray(body.content)) {
    return "Lesson content must be an array.";
  }

  if (!Array.isArray(body.activities)) {
    return "Activities must be an array.";
  }

  if (!Array.isArray(body.evaluation)) {
    return "Evaluation must be an array.";
  }

  if (!Array.isArray(body.periods) || body.periods.length !== 4) {
    return "Exactly four lesson periods are required.";
  }

  const periodNumbers = body.periods.map(
    period => Number(period.periodNumber)
  );

  if (
    periodNumbers.some(number => !Number.isInteger(number)) ||
    [...periodNumbers].sort().join(",") !== "1,2,3,4"
  ) {
    return "Periods 1, 2, 3 and 4 must each appear exactly once.";
  }

  for (const period of body.periods) {
    if (!String(period.title || "").trim()) {
      return `Period ${period.periodNumber} requires a title.`;
    }

    if (!String(period.lessonContent || "").trim()) {
      return `Period ${period.periodNumber} requires lesson content.`;
    }

    if (!Array.isArray(period.speedWork)) {
      return `Period ${period.periodNumber} speed work must be an array.`;
    }
  }

  return null;
}

function buildPeriod(period, lessonNoteId) {
  return {
    lessonNoteId,
    periodNumber: Number(period.periodNumber),
    title: period.title.trim(),
    duration: Number(period.duration || 40),
    teacherActivities: period.teacherActivities || "",
    studentActivities: period.studentActivities || "",
    lessonContent: period.lessonContent,
    speedWork: period.speedWork,
    conclusion: period.conclusion || ""
  };
}

// GET all matching weekly lesson notes.
router.get("/", async (req, res) => {
  try {
    const {
      academicSession,
      term,
      className,
      subject
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
        "topic"
      ],
      order: [["weekNumber", "ASC"]]
    });

    return res.json({
      success: true,
      lessonNotes: notes
    });
  } catch (error) {
    console.error("Fetch lesson notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch lesson notes."
    });
  }
});

// GET one weekly lesson note with all four periods.
router.get("/:id", async (req, res) => {
  try {
    const note = await LessonNote.findByPk(req.params.id, {
      include: [
        {
          model: LessonNotePeriod,
          as: "periods"
        }
      ],
      order: [[{ model: LessonNotePeriod, as: "periods" }, "periodNumber", "ASC"]]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Lesson note not found."
      });
    }

    return res.json({
      success: true,
      lessonNote: note
    });
  } catch (error) {
    console.error("Fetch lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch this lesson note."
    });
  }
});

// CREATE a weekly lesson note and its four periods.
router.post("/", async (req, res) => {
  const validationError = validateLesson(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const note = await LessonNote.create(
      {
        academicSession: req.body.academicSession.trim(),
        term: req.body.term,
        className: req.body.className.trim(),
        subject: req.body.subject.trim(),
        weekNumber: Number(req.body.weekNumber),
        topic: req.body.topic.trim(),
        objectives: req.body.objectives,
        materials: req.body.materials || "",
        previousKnowledge: req.body.previousKnowledge || "",
        content: req.body.content,
        activities: req.body.activities,
        evaluation: req.body.evaluation,
        assignment: req.body.assignment || ""
      },
      { transaction }
    );

    await LessonNotePeriod.bulkCreate(
      req.body.periods.map(period =>
        buildPeriod(period, note.id)
      ),
      { transaction }
    );

    await transaction.commit();

    const savedNote = await LessonNote.findByPk(note.id, {
      include: [
        {
          model: LessonNotePeriod,
          as: "periods"
        }
      ],
      order: [[{ model: LessonNotePeriod, as: "periods" }, "periodNumber", "ASC"]]
    });

    return res.status(201).json({
      success: true,
      message: "Lesson note created successfully.",
      lessonNote: savedNote
    });
  } catch (error) {
    await transaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A lesson note already exists for this session, term, class, subject and week."
      });
    }

    console.error("Create lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the lesson note."
    });
  }
});

// UPDATE an existing weekly lesson note and replace its four periods.
router.put("/:id", async (req, res) => {
  const validationError = validateLesson(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const note = await LessonNote.findByPk(req.params.id, {
      transaction
    });

    if (!note) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Lesson note not found."
      });
    }

    await note.update(
      {
        academicSession: req.body.academicSession.trim(),
        term: req.body.term,
        className: req.body.className.trim(),
        subject: req.body.subject.trim(),
        weekNumber: Number(req.body.weekNumber),
        topic: req.body.topic.trim(),
        objectives: req.body.objectives,
        materials: req.body.materials || "",
        previousKnowledge: req.body.previousKnowledge || "",
        content: req.body.content,
        activities: req.body.activities,
        evaluation: req.body.evaluation,
        assignment: req.body.assignment || ""
      },
      { transaction }
    );

    await LessonNotePeriod.destroy({
      where: { lessonNoteId: note.id },
      transaction
    });

    await LessonNotePeriod.bulkCreate(
      req.body.periods.map(period =>
        buildPeriod(period, note.id)
      ),
      { transaction }
    );

    await transaction.commit();

    const savedNote = await LessonNote.findByPk(note.id, {
      include: [
        {
          model: LessonNotePeriod,
          as: "periods"
        }
      ],
      order: [[{ model: LessonNotePeriod, as: "periods" }, "periodNumber", "ASC"]]
    });

    return res.json({
      success: true,
      message: "Lesson note updated successfully.",
      lessonNote: savedNote
    });
  } catch (error) {
    await transaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Another lesson note already uses this session, term, class, subject and week."
      });
    }

    console.error("Update lesson note error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the lesson note."
    });
  }
});

module.exports = router;
