const express = require("express");
const multer = require("multer");
const { Readable } = require("stream");
const { randomUUID } = require("crypto");
const { Op } = require("sequelize");

const sequelize = require("../db");
const QuestionBankItem = require("../models/QuestionBankItem");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]);

const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 100
    },
    fileFilter(req, file, callback) {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            return callback(
                new Error("Use a JPG, PNG, WEBP, or GIF image.")
            );
        }

        callback(null, true);
    }
});

function uploadImageToCloudinary(file, batchId, questionIndex) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "etrend-education/questions-v2",
                resource_type: "image",
                context: {
                    batch_id: batchId,
                    question_index: String(questionIndex + 1)
                }
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result) {
                    return reject(
                        new Error("Cloudinary returned no upload result.")
                    );
                }

                resolve(result);
            }
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function validateQuestion(question, questionType) {
    if (
        !question ||
        typeof question !== "object" ||
        Array.isArray(question)
    ) {
        return "Invalid question data.";
    }

    if (
        typeof question.text !== "string" ||
        !question.text.trim()
    ) {
        return "Question text is required.";
    }

    if (questionType === "objective") {
        if (
            !Array.isArray(question.options) ||
            question.options.length !== 4
        ) {
            return "Four options are required.";
        }

        if (
            question.options.some(
                option =>
                    typeof option !== "string" ||
                    !option.trim()
            )
        ) {
            return "All four options must contain text.";
        }

        if (
            typeof question.answer !== "string" ||
            !VALID_ANSWERS.has(question.answer.toUpperCase())
        ) {
            return "Correct answer must be A, B, C, or D.";
        }
    }

    if (
        questionType === "theory" &&
        question.answer !== undefined &&
        typeof question.answer !== "string"
    ) {
        return "The theory model answer must be text.";
    }

    return null;
}

function handleUploadError(error, req, res, next) {
    if (!error) {
        return next();
    }

    let message = error.message || "Image upload failed.";

    if (error.code === "LIMIT_FILE_SIZE") {
        message = "Each image must be 5 MB or smaller.";
    } else if (error.code === "LIMIT_FILE_COUNT") {
        message = "A maximum of 100 images is allowed per batch.";
    }

    return res.status(400).json({
        success: false,
        message
    });
}

/*
POST /api/v2/question-bank/batch

Form fields:
    className
    subject
    topic
    questionType
    questions  -> JSON array

Optional image fields:
    image_0
    image_1
    image_2

The number in image_N matches the question's zero-based position.
*/

router.post(
    "/batch",
    (req, res, next) => {
        upload.any()(req, res, error => {
            handleUploadError(error, req, res, next);
        });
    },
    async (req, res) => {
        const cloudinaryPublicIds = [];
        let transaction;

        try {
            const {
                className,
                subject,
                topic,
                questionType,
                questions: rawQuestions
            } = req.body;

            if (
                !isNonEmptyString(className) ||
                !isNonEmptyString(subject) ||
                !isNonEmptyString(topic)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Class, subject, and topic are required."
                });
            }

            if (
                !["objective", "theory"].includes(questionType)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Question type must be objective or theory."
                });
            }

            let questions;

            try {
                questions =
                    typeof rawQuestions === "string"
                        ? JSON.parse(rawQuestions)
                        : rawQuestions;
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "The questions data is not valid JSON."
                });
            }

            if (
                !Array.isArray(questions) ||
                questions.length < 1 ||
                questions.length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Submit between 1 and 100 questions per batch."
                });
            }

            // Validate every question before uploading any images.
            for (let i = 0; i < questions.length; i++) {
                const validationError = validateQuestion(
                    questions[i],
                    questionType
                );

                if (validationError) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1}: ${validationError}`
                    });
                }
            }

            const imageByIndex = new Map();

            for (const file of req.files || []) {
                const match = /^image_(\d+)$/.exec(file.fieldname);

                if (!match) {
                    return res.status(400).json({
                        success: false,
                        message: `Unexpected image field: ${file.fieldname}`
                    });
                }

                const index = Number(match[1]);

                if (
                    !Number.isInteger(index) ||
                    index < 0 ||
                    index >= questions.length ||
                    imageByIndex.has(index)
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "An image is assigned to an invalid question."
                    });
                }

                imageByIndex.set(index, file);
            }

            const batchId = randomUUID();
            const records = [];

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];

                let imageUrl = null;
                let imagePublicId = null;

                const imageFile = imageByIndex.get(i);

                if (imageFile) {
                    const uploaded = await uploadImageToCloudinary(
                        imageFile,
                        batchId,
                        i
                    );

                    cloudinaryPublicIds.push(uploaded.public_id);

                    imageUrl = uploaded.secure_url;
                    imagePublicId = uploaded.public_id;
                }

                records.push({
                    batchId,
                    className: className.trim(),
                    subject: subject.trim(),
                    topic: topic.trim(),
                    questionType,

                    // Preserve the question text exactly as received.
                    text: question.text,

                    options:
                        questionType === "objective"
                            ? question.options
                            : [],

                    answer:
                        questionType === "objective"
                            ? question.answer.toUpperCase()
                            : question.answer ?? "",

                    imageUrl,
                    imagePublicId
                });
            }

            transaction = await sequelize.transaction();

            const savedQuestions = await QuestionBankItem.bulkCreate(
                records,
                {
                    transaction,
                    returning: true,
                    validate: true
                }
            );

            await transaction.commit();
            transaction = null;

            return res.status(201).json({
                success: true,
                message: `${savedQuestions.length} questions saved successfully.`,
                data: savedQuestions
            });
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Question batch rollback failed:",
                        rollbackError
                    );
                }
            }

            // Clean up images if saving the batch fails.
            for (const publicId of cloudinaryPublicIds) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cleanupError) {
                    console.error(
                        "Cloudinary cleanup failed:",
                        cleanupError.message
                    );
                }
            }

            console.error("Question batch save failed:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save the questions. Check the server logs."
            });
        }
    }
);

/*
GET /api/v2/question-bank?className=SS%201&subject=Biology

Optional:
    &topic=Cell%20Structure
    &questionType=objective
*/

router.get("/", async (req, res) => {
    try {
        const {
            className,
            subject,
            topic,
            questionType
        } = req.query;

        if (
            !isNonEmptyString(className) ||
            !isNonEmptyString(subject)
        ) {
            return res.status(400).json({
                success: false,
                message: "className and subject are required."
            });
        }

        const where = {
            className: {
                [Op.iLike]: className.trim()
            },
            subject: {
                [Op.iLike]: subject.trim()
            }
        };

        if (isNonEmptyString(topic)) {
            where.topic = {
                [Op.iLike]: topic.trim()
            };
        }

        if (["objective", "theory"].includes(questionType)) {
            where.questionType = questionType;
        }

        const questions = await QuestionBankItem.findAll({
            where,
            order: [
                ["topic", "ASC"],
                ["id", "ASC"]
            ]
        });

        return res.status(200).json({
            success: true,
            data: {
                topics: [
                    ...new Set(questions.map(item => item.topic))
                ],
                questions
            }
        });
    } catch (error) {
        console.error("Question retrieval failed:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve questions."
        });
    }
});

module.exports = router;