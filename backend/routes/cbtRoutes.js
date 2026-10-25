
const express = require("express");
const { Op } = require("sequelize");
const QuestionBankItem = require("../models/QuestionBankItem");

const router = express.Router();

const QUESTION_TYPE = "objective";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getOptionText(option) {
  if (typeof option === "string") return option;

  if (option && typeof option === "object") {
    return String(
      option.text ??
      option.label ??
      option.value ??
      option.option ??
      ""
    );
  }

  return "";
}

function getOptionLabel(option, index) {
  if (option && typeof option === "object") {
    return String(
      option.label ??
      option.key ??
      String.fromCharCode(65 + index)
    );
  }

  return String.fromCharCode(65 + index);
}

function getOptions(question) {
  return Array.isArray(question.options)
    ? question.options
    : [];
}

function findCorrectOption(question) {
  const answer = cleanText(question.answer);

  if (!answer) return null;

  const options = getOptions(question);
  const normalizedAnswer = answer.toLowerCase();

  // First, support answers stored as A, B, C, D, etc.
  const letterIndex = normalizedAnswer.match(/^[a-z]$/)
    ? normalizedAnswer.charCodeAt(0) - 97
    : -1;

  if (letterIndex >= 0 && letterIndex < options.length) {
    const label = getOptionLabel(options[letterIndex], letterIndex);

    if (
      label.toLowerCase() === normalizedAnswer ||
      String.fromCharCode(65 + letterIndex).toLowerCase() ===
        normalizedAnswer
    ) {
      return letterIndex;
    }
  }

  // Also support answers stored as the option's text or label.
  const matchingIndex = options.findIndex((option, index) => {
    const values = [
      getOptionText(option),
      getOptionLabel(option, index),
      option && typeof option === "object" ? option.key : ""
    ];

    return values.some(
      value =>
        String(value ?? "").trim().toLowerCase() ===
        normalizedAnswer
    );
  });

  return matchingIndex >= 0 ? matchingIndex : null;
}

function publicQuestion(question) {
  return {
    id: question.id,
    className: question.className,
    subject: question.subject,
    topic: question.topic,
    text: question.text,
    options: getOptions(question).map((option, index) => ({
      label: getOptionLabel(option, index),
      text: getOptionText(option),
      value: String(index)
    })),
    imageUrl: question.imageUrl || null
  };
}

// GET /api/cbt/classes
router.get("/classes", async (req, res) => {
  try {
    const rows = await QuestionBankItem.findAll({
      attributes: ["className"],
      where: { questionType: QUESTION_TYPE },
      group: ["className"],
      order: [["className", "ASC"]],
      raw: true
    });

    res.json({
      success: true,
      data: rows.map(row => row.className).filter(Boolean)
    });
  } catch (error) {
    console.error("CBT classes error:", error);
    res.status(500).json({
      success: false,
      message: "Could not load available classes."
    });
  }
});

// GET /api/cbt/subjects?className=...
router.get("/subjects", async (req, res) => {
  try {
    const className = cleanText(req.query.className);

    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Please select a class."
      });
    }

    const rows = await QuestionBankItem.findAll({
      attributes: ["subject"],
      where: {
        className,
        questionType: QUESTION_TYPE
      },
      group: ["subject"],
      order: [["subject", "ASC"]],
      raw: true
    });

    res.json({
      success: true,
      data: rows.map(row => row.subject).filter(Boolean)
    });
  } catch (error) {
    console.error("CBT subjects error:", error);
    res.status(500).json({
      success: false,
      message: "Could not load subjects."
    });
  }
});

// GET /api/cbt/topics?className=...&subject=...
router.get("/topics", async (req, res) => {
  try {
    const className = cleanText(req.query.className);
    const subject = cleanText(req.query.subject);

    if (!className || !subject) {
      return res.status(400).json({
        success: false,
        message: "Select a class and subject first."
      });
    }

    const rows = await QuestionBankItem.findAll({
      attributes: ["topic"],
      where: {
        className,
        subject,
        questionType: QUESTION_TYPE
      },
      group: ["topic"],
      order: [["topic", "ASC"]],
      raw: true
    });

    res.json({
      success: true,
      data: rows.map(row => row.topic).filter(Boolean)
    });
  } catch (error) {
    console.error("CBT topics error:", error);
    res.status(500).json({
      success: false,
      message: "Could not load topics."
    });
  }
});

// POST /api/cbt/start
router.post("/start", async (req, res) => {
  try {
    const className = cleanText(req.body.className);
    const subject = cleanText(req.body.subject);
    const topic = cleanText(req.body.topic);
    const count = Number(req.body.count);
    const durationMinutes = Number(req.body.durationMinutes);

    if (!className || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: "Select a class, subject, and topic."
      });
    }

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 200
    ) {
      return res.status(400).json({
        success: false,
        message: "Question count must be between 1 and 200."
      });
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 300
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 1 and 300 minutes."
      });
    }

    const where = {
      className,
      subject,
      questionType: QUESTION_TYPE
    };

    // "All Topics" means no topic filter.
    if (topic !== "ALL_TOPICS") {
      where.topic = topic;
    }

    const availableQuestions = await QuestionBankItem.findAll({
      where,
      attributes: [
        "id",
        "className",
        "subject",
        "topic",
        "text",
        "options",
        "imageUrl"
      ]
    });

    if (availableQuestions.length < count) {
      return res.status(400).json({
        success: false,
        message:
          `Only ${availableQuestions.length} objective question(s) ` +
          "are available for your selection. Choose fewer questions " +
          "or another topic."
      });
    }

    const selectedQuestions = shuffle(availableQuestions)
      .slice(0, count)
      .map(publicQuestion);

    res.json({
      success: true,
      data: {
        className,
        subject,
        topic,
        durationMinutes,
        questions: selectedQuestions
      }
    });
  } catch (error) {
    console.error("CBT start error:", error);
    res.status(500).json({
      success: false,
      message: "Could not start the exam."
    });
  }
});

// POST /api/cbt/submit
router.post("/submit", async (req, res) => {
  try {
    const submittedQuestions = req.body.answers;

    if (
      !Array.isArray(submittedQuestions) ||
      submittedQuestions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "There are no answers to mark."
      });
    }

    const ids = [
      ...new Set(
        submittedQuestions.map(item => String(item.questionId))
      )
    ];

    const questions = await QuestionBankItem.findAll({
      where: {
        id: { [Op.in]: ids },
        questionType: QUESTION_TYPE
      }
    });

    const questionMap = new Map(
      questions.map(question => [String(question.id), question])
    );

    let score = 0;

    const results = submittedQuestions.map(item => {
      const question = questionMap.get(String(item.questionId));

      if (!question) {
        return {
          questionId: String(item.questionId),
          question: "Question no longer available.",
          selectedAnswer: null,
          correctAnswer: null,
          isCorrect: false
        };
      }

      const options = getOptions(question);
      const correctIndex = findCorrectOption(question);
      const selectedValue =
        item.selectedOption === null ||
        item.selectedOption === undefined
          ? null
          : String(item.selectedOption);

      const selectedIndex =
        selectedValue === null ? -1 : Number(selectedValue);

      const isCorrect =
        correctIndex !== null &&
        Number.isInteger(selectedIndex) &&
        selectedIndex === correctIndex;

      if (isCorrect) score++;

      return {
        questionId: String(question.id),
        className: question.className,
        subject: question.subject,
        topic: question.topic,
        question: question.text,
        imageUrl: question.imageUrl || null,
        options: options.map((option, index) => ({
          label: getOptionLabel(option, index),
          text: getOptionText(option),
          value: String(index)
        })),
        selectedAnswer:
          selectedIndex >= 0 && selectedIndex < options.length
            ? getOptionText(options[selectedIndex])
            : null,
        correctAnswer:
          correctIndex !== null
            ? getOptionText(options[correctIndex])
            : "Answer needs review",
        isCorrect
      };
    });

    res.json({
      success: true,
      data: {
        total: submittedQuestions.length,
        answered: submittedQuestions.filter(
          item =>
            item.selectedOption !== null &&
            item.selectedOption !== undefined
        ).length,
        score,
        percentage: Math.round(
          (score / submittedQuestions.length) * 100
        ),
        results
      }
    });
  } catch (error) {
    console.error("CBT submit error:", error);
    res.status(500).json({
      success: false,
      message: "Could not mark the exam."
    });
  }
});

module.exports = router;
