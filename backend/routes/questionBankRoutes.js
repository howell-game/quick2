
const express = require("express");
const { Op } = require("sequelize");
const Question = require("../models/Question");

const router = express.Router();

// GET /api/question-bank?className=SS1&subject=Biology
router.get("/", async (req, res) => {
  try {
    const { className, subject } = req.query;

    if (!className || !subject) {
      return res.status(400).json({
        success: false,
        message: "Both className and subject are required.",
      });
    }

    const questions = await Question.findAll({
      where: {
        className: {
          [Op.iLike]: className.trim(),
        },
        subject: {
          [Op.iLike]: subject.trim(),
        },
      },
      order: [
        ["topic", "ASC"],
        ["id", "ASC"],
      ],
    });

    const formattedQuestions = questions.map((question) => {
      const item = question.toJSON();

      return {
        id: item.id,
        className: item.className,
        subject: item.subject,
        topic: item.topic,
        questionType: item.questionType,
        text: item.text,
        options: item.options || [],
        answer: item.answer || "",
      };
    });

    const topics = [
      ...new Set(
        formattedQuestions.map((question) => question.topic)
      ),
    ];

    return res.status(200).json({
      success: true,
      data: {
        topics,
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Question bank retrieval error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the question bank.",
    });
  }
});


/*
 * POST /api/question-bank
 * Saves one objective or theory question to PostgreSQL.
 */
router.post("/", async (req, res) => {
  try {
    const {
      className,
      subject,
      topic,
      questionType,
      text,
      options,
      answer,
    } = req.body;

    // Validate required fields without changing their original text.
    if (
      typeof className !== "string" ||
      !className.trim() ||
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof topic !== "string" ||
      !topic.trim() ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Class, subject, topic, and question are required.",
      });
    }

    if (!["objective", "theory"].includes(questionType)) {
      return res.status(400).json({
        success: false,
        message: "Question type must be objective or theory.",
      });
    }

    let savedOptions = [];
    let savedAnswer = "";

    if (questionType === "objective") {
      if (
        !Array.isArray(options) ||
        options.length !== 4 ||
        options.some(
          (option) =>
            typeof option !== "string" || !option.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Objective questions require four non-empty options.",
        });
      }

      if (!["A", "B", "C", "D"].includes(answer)) {
        return res.status(400).json({
          success: false,
          message: "Choose A, B, C, or D as the correct answer.",
        });
      }

      // Preserve each option exactly as supplied by the frontend.
      savedOptions = options;
      savedAnswer = answer;
    } else {
      // Theory answers are free text and may contain symbols or line breaks.
      if (answer !== undefined && typeof answer !== "string") {
        return res.status(400).json({
          success: false,
          message: "The theory answer must be text.",
        });
      }

      savedAnswer = answer || "";
    }

    const question = await Question.create({
      className,
      subject,
      topic,
      questionType,
      text,
      options: savedOptions,
      answer: savedAnswer,
    });

    return res.status(201).json({
      success: true,
      message: "Question saved successfully.",
      data: {
        id: question.id,
        className: question.className,
        subject: question.subject,
        topic: question.topic,
        questionType: question.questionType,
        text: question.text,
        options: question.options,
        answer: question.answer,
      },
    });
  } catch (error) {
    console.error("Question creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the question.",
    });
  }
});


module.exports = router;
