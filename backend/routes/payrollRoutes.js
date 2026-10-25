
const express = require("express");
const { Op } = require("sequelize");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Teacher = require("../models/Teacher");

const crypto = require("crypto");
const sequelize = require("../db");
const PayrollBatch = require("../models/PayrollBatch");
const PayrollItem = require("../models/PayrollItem");


const {
  resolveAccount,
} = require("../services/flutterwaveService");

const {
  normalizeStatus,
} = require("../utils/normalize");

// All endpoints in this file require a valid JWT.
router.use(authMiddleware);

// Confirm the authenticated user still exists and is verified.
async function getVerifiedUser(userId) {
  const user = await User.findOne({
    where: { userId },
  });

  if (!user) {
    const error = new Error("User account not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error(
      "Please verify your email before managing payroll."
    );
    error.statusCode = 403;
    throw error;
  }

  return user;
}

// GET /api/payroll/teachers
// List only the authenticated proprietor's teachers.
router.get("/teachers", async (req, res) => {
  try {
    await getVerifiedUser(req.user.userId);

    const teachers = await Teacher.findAll({
      where: {
        userId: req.user.userId,
        active: true,
      },
      attributes: [
        "id",
        "name",
        "accountName",
        "accountNumber",
        "bankCode",
        "bankName",
        "active",
        "createdAt",
      ],
      order: [["name", "ASC"]],
    });

    return res.json({
      success: true,
      teachers,
    });
  } catch (error) {
    console.error("Load payroll teachers:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load teachers.",
    });
  }
});

// POST /api/payroll/teachers
// Verify bank details on the server before saving a teacher.
router.post("/teachers", async (req, res) => {
  try {
    await getVerifiedUser(req.user.userId);

    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    const accountNumber =
      typeof req.body.accountNumber === "string"
        ? req.body.accountNumber.trim()
        : "";

    const bankCode =
      typeof req.body.bankCode === "string"
        ? req.body.bankCode.trim()
        : "";

    if (!name || name.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid teacher name.",
      });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit bank account number.",
      });
    }

    if (!bankCode || bankCode.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Select a valid bank.",
      });
    }

    // Do not trust accountName or bankName supplied by the browser.
    const verification = await resolveAccount(
      accountNumber,
      bankCode
    );

    const status = normalizeStatus(verification.status);
    const verified = verification.data;

    if (
      status !== "successful" ||
      !verified ||
      !verified.account_name ||
      !verified.account_number ||
      String(verified.account_number).trim() !== accountNumber
    ) {
      return res.status(400).json({
        success: false,
        message:
          verification.message ||
          "Bank account verification failed. Please check the details.",
      });
    }

    const existing = await Teacher.findOne({
      where: {
        userId: req.user.userId,
        bankCode,
        accountNumber,
      },
    });

    if (existing) {
      if (!existing.active) {
        return res.status(409).json({
          success: false,
          message:
            "This account is already registered but inactive. Contact support to reactivate it.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This bank account is already registered.",
      });
    }

    const teacher = await Teacher.create({
      userId: req.user.userId,
      name,
      accountName: String(verified.account_name).trim(),
      accountNumber,
      bankCode,
      bankName:
        typeof req.body.bankName === "string"
          ? req.body.bankName.trim()
          : "Bank",
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: "Teacher saved successfully.",
      teacher: {
        id: teacher.id,
        name: teacher.name,
        accountName: teacher.accountName,
        accountNumber: teacher.accountNumber,
        bankCode: teacher.bankCode,
        bankName: teacher.bankName,
        active: teacher.active,
      },
    });
  } catch (error) {
    console.error("Save payroll teacher:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to save teacher.",
    });
  }
});

// DELETE /api/payroll/teachers/:id
// Soft-deactivate a teacher instead of deleting payroll-related history.
router.delete("/teachers/:id", async (req, res) => {
  try {
    await getVerifiedUser(req.user.userId);

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID.",
      });
    }

    const teacher = await Teacher.findOne({
      where: {
        id,
        userId: req.user.userId,
        active: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    teacher.active = false;
    await teacher.save();

    return res.json({
      success: true,
      message: "Teacher deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate payroll teacher:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to deactivate teacher.",
    });
  }
});



function calculatePayrollFee(totalCents) {
  if (totalCents <= 100000) return 500;
  if (totalCents <= 500000) return 5000;
  if (totalCents <= 2000000) return 10000;
  if (totalCents <= 10000000) return 20000;
  if (totalCents <= 25000000) return 50000;
  return 100000;
}

function naira(cents) {
  return (cents / 100).toFixed(2);
}

// POST /api/payroll/batches
// Creates a payroll draft only. It DOES NOT transfer money.
router.post("/batches", async (req, res) => {
  const userId = req.user.userId;
  const idempotencyKey = String(
    req.get("Idempotency-Key") || ""
  ).trim();

  try {
    await getVerifiedUser(userId);

    if (
      !idempotencyKey ||
      idempotencyKey.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a unique Idempotency-Key header for this payroll submission.",
      });
    }

    const items = req.body.items;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Select between 1 and 100 teachers per payroll batch.",
      });
    }

    // A repeated submission key must never create a second batch.
    const existingBatch = await PayrollBatch.findOne({
      where: { userId, idempotencyKey },
    });

    if (existingBatch) {
      const existingItems = await PayrollItem.findAll({
        where: { batchId: existingBatch.id },
        order: [["id", "ASC"]],
      });

      return res.status(200).json({
        success: true,
        duplicateSubmission: true,
        message: "This payroll submission was already received.",
        batch: existingBatch,
        items: existingItems,
      });
    }

    const normalizedItems = [];
    const seenTeacherIds = new Set();

    for (const item of items) {
      const teacherId = Number(item?.teacherId);
      const amount = Number(item?.amount);

      if (
        !Number.isSafeInteger(teacherId) ||
        teacherId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A selected teacher ID is invalid.",
        });
      }

      if (seenTeacherIds.has(teacherId)) {
        return res.status(400).json({
          success: false,
          message: "A teacher cannot appear twice in one payroll batch.",
        });
      }

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isSafeInteger(Math.round(amount * 100)) ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001
      ) {
        return res.status(400).json({
          success: false,
          message: "Every salary must be greater than zero and have no more than two decimal places.",
        });
      }

      seenTeacherIds.add(teacherId);

      normalizedItems.push({
        teacherId,
        amountCents: Math.round(amount * 100),
      });
    }

    const teacherIds = normalizedItems.map(
      (item) => item.teacherId
    );

    // Only retrieve active teachers owned by this authenticated user.
    const teachers = await Teacher.findAll({
      where: {
        id: { [Op.in]: teacherIds },
        userId,
        active: true,
      },
    });

    if (teachers.length !== normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message:
          "One or more selected teachers are unavailable. Refresh your teacher list and try again.",
      });
    }

    const teacherMap = new Map(
      teachers.map((teacher) => [
        teacher.id,
        teacher,
      ])
    );

    const totalCents = normalizedItems.reduce(
      (sum, item) => sum + item.amountCents,
      0
    );

    if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
      return res.status(400).json({
        success: false,
        message: "The payroll total is invalid.",
      });
    }

    const feeCents = calculatePayrollFee(totalCents);
    const reference = `PAY-${crypto.randomUUID()}`;

    const batch = await sequelize.transaction(
      async (transaction) => {
        const createdBatch = await PayrollBatch.create(
          {
            userId,
            reference,
            idempotencyKey,
            totalAmount: naira(totalCents),
            serviceFee: naira(feeCents),
            teacherCount: normalizedItems.length,
            status: "DRAFT",
          },
          { transaction }
        );

        const payrollItems = normalizedItems.map(
          (item) => {
            const teacher = teacherMap.get(item.teacherId);

            return {
              batchId: createdBatch.id,
              teacherId: teacher.id,
              teacherName: teacher.name,
              accountName: teacher.accountName,
              accountNumber: teacher.accountNumber,
              bankCode: teacher.bankCode,
              bankName: teacher.bankName,
              amount: naira(item.amountCents),
              transferReference:
                `PAYITEM-${crypto.randomUUID()}`,
              status: "PENDING",
            };
          }
        );

        await PayrollItem.bulkCreate(payrollItems, {
          transaction,
        });

        return createdBatch;
      }
    );

    const savedItems = await PayrollItem.findAll({
      where: { batchId: batch.id },
      order: [["id", "ASC"]],
    });

    return res.status(201).json({
      success: true,
      message:
        "Payroll draft created. No money has been transferred.",
      batch,
      items: savedItems,
      breakdown: {
        salaryTotal: naira(totalCents),
        etrendServiceFee: naira(feeCents),
        totalBeforeAnyFlutterwaveFees: naira(
          totalCents + feeCents
        ),
      },
    });
  } catch (error) {
    // Concurrent requests can race on the unique idempotency index.
    if (error.name === "SequelizeUniqueConstraintError") {
      const existingBatch = await PayrollBatch.findOne({
        where: { userId, idempotencyKey },
      });

      if (existingBatch) {
        return res.status(200).json({
          success: true,
          duplicateSubmission: true,
          message: "This payroll submission was already received.",
          batch: existingBatch,
        });
      }
    }

    console.error("Create payroll draft:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to create payroll draft.",
    });
  }
});

// GET /api/payroll/batches
// List only this proprietor's payroll batches.
router.get("/batches", async (req, res) => {
  try {
    await getVerifiedUser(req.user.userId);

    const batches = await PayrollBatch.findAll({
      where: { userId: req.user.userId },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    return res.json({
      success: true,
      batches,
    });
  } catch (error) {
    console.error("List payroll batches:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load payroll history.",
    });
  }
});

// GET /api/payroll/batches/:id
// Read a batch and its items only if the caller owns it.
router.get("/batches/:id", async (req, res) => {
  try {
    await getVerifiedUser(req.user.userId);

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll batch ID.",
      });
    }

    const batch = await PayrollBatch.findOne({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Payroll batch not found.",
      });
    }

    const items = await PayrollItem.findAll({
      where: { batchId: batch.id },
      order: [["id", "ASC"]],
    });

    return res.json({
      success: true,
      batch,
      items,
    });
  } catch (error) {
    console.error("Read payroll batch:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to load payroll batch.",
    });
  }
});


module.exports = router;
