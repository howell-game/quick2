const express = require("express");
const axios = require("axios");
const { Op } = require("sequelize");

const router = express.Router();

const User = require("../models/User");
const Bank = require("../models/Bank");
const Transaction = require("../models/Transaction");
const FRONTEND_URL=process.env.FRONTEND_URL;

const {
    createPayment,
    resolveAccount,
    transfer,
} = require("../services/flutterwaveService");

const {
    normalizeStatus,
    normalizeEvent,
} = require("../utils/normalize");

function generateReference(prefix = "TXN") {

    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

}

function webhookVerified(req) {

    return (
        req.headers["verif-hash"] === process.env.FLW_SECRET_HASH
    );

}

async function transactionExists(reference) {

    return await Transaction.findOne({

        where: {
            reference,
        },

    });

}

async function creditUser(userId, amount, dbTransaction = null) {
    const user = await User.findOne({

    where: {

        userId

    },

    transaction: dbTransaction,

    lock: dbTransaction
        ? dbTransaction.LOCK.UPDATE
        : undefined

});

    if (!user) throw new Error("User not found");

    user.balance = Number(user.balance) + Number(amount);

    await user.save({
        transaction: dbTransaction,
    });
}

async function debitUser(userId, amount, dbTransaction = null) {
    const user = await User.findOne({

    where: {

        userId

    },

    transaction: dbTransaction,

    lock: dbTransaction
        ? dbTransaction.LOCK.UPDATE
        : undefined

});

    if (!user) throw new Error("User not found");

    if (Number(user.balance) < Number(amount))
        throw new Error("Insufficient balance");

    user.balance = Number(user.balance) - Number(amount);

    await user.save({
        transaction: dbTransaction,
    });
}

async function refundUser(userId, amount, dbTransaction = null) {
    const user = await User.findOne({

    where: {

        userId

    },

    transaction: dbTransaction,

    lock: dbTransaction
        ? dbTransaction.LOCK.UPDATE
        : undefined

});

    if (!user) throw new Error("User not found");

    user.balance = Number(user.balance) + Number(amount);

    await user.save({
        transaction: dbTransaction,
    });
}

router.get("/banks", async (req, res) => {

    try {

        const banks = await Bank.findAll({

            where: {
                active: true,
            },

            order: [
                ["name", "ASC"],
            ],

        });

        console.log(banks.find(b => b.code === "076"));
console.log(banks.find(b => b.name.includes("Polaris")));

        return res.json(banks);

    }

    catch (err) {

        console.log(err);

        return res.status(500).json({

            error: "Unable to load banks",

        });

    }

});

router.post("/deposit", async (req, res) => {

    try {

        const {

            userId,
            amount,

        } = req.body;

        if (!userId || !amount)
            return res.status(400).json({

                error: "Invalid request",

            });

        const user = await User.findOne({
    where: {
        userId: userId
    }
});
        if (!user)
            return res.status(404).json({

                error: "User not found",

            });

        const reference = generateReference("DEP");

        await Transaction.create({

            userId,

            amount,

            reference,

            transactionId: reference,

            transactionType: "deposit",

            status: "pending",

        });

        const payment = await createPayment({

            tx_ref: reference,

            amount,

            currency: "NGN",

            redirect_url:
                `${FRONTEND_URL}/#/payment-success`,

            customer: {

                email: user.email,

                name: user.name,

            },

            customizations: {

                title: "Wallet Deposit",

            },

        });

        return res.json({

            paymentLink: payment.data.link,

        });

    }

    catch (err) {

        console.log(err.response?.data || err);

        return res.status(500).json({

            error: "Deposit initialization failed",

        });

    }

});

// Fetch all transactions (deposits & withdrawals) for a user
router.get("/transactions/:userId", async (req, res) => {
    try {

        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        const transactions = await Transaction.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]]
        });

        const deposits = [];
        const withdrawals = [];

        for (const transaction of transactions) {

            const type = String(transaction.transactionType || "")
                .trim()
                .toLowerCase();

            if (type === "deposit") {
                deposits.push(transaction);
            }
            else if (type === "withdrawal") {
                withdrawals.push(transaction);
            }

        }

        return res.json({
            deposits,
            withdrawals,
            transactions
        });

    } catch (error) {

        console.error("Error fetching transactions:", error);

        return res.status(500).json({
            error: "Internal server error"
        });

    }
});


router.post("/resolve-account", async (req, res) => {

    try {

        const {

            accountNumber,
            bankCode,

        } = req.body;

        if (!accountNumber || !bankCode)
            return res.status(400).json({

                error: "Account number and bank are required",

            });

        const response = await resolveAccount(

            accountNumber,

            bankCode

        );

        const status = normalizeStatus(response.status);

        if (status !== "successful")
            return res.status(400).json({

                error: response.message,

            });

        return res.json({

            accountName: response.data.account_name,

            accountNumber: response.data.account_number,

            bankCode,

        });

    }

    catch (err) {

        console.log(err.response?.data || err);

        return res.status(500).json({

            error: "Unable to resolve account",

        });

    }

});

router.post("/withdraw", async (req, res) => {

    try {

        const {

            userId,
            amount,
            accountNumber,
            bankCode,

        } = req.body;

        if (
            !userId ||
            !amount ||
            !accountNumber ||
            !bankCode
        ) {

            return res.status(400).json({

                error: "Missing required fields",

            });

        }

        const user = await User.findOne({
    where: {
        userId: userId
    }
});

        if (!user)
            return res.status(404).json({

                error: "User not found",

            });

        /*
        Resolve account again.

        Never trust frontend.
        */

        const resolved = await resolveAccount(

            accountNumber,

            bankCode

        );

        const resolvedStatus = normalizeStatus(
            resolved.status
        );

        if (resolvedStatus !== "successful")
            return res.status(400).json({

                error: "Unable to verify account",

            });

        /*
        Check wallet balance
        */

        if (
            Number(user.balance) <
            Number(amount)
        ) {

            return res.status(400).json({

                error: "Insufficient balance",

            });

        }

        /*
        Deduct first
        */

        await debitUser(

            userId,

            amount

        );

        const reference =
            generateReference("WTH");

        /*
        Save pending transaction
        */

        const bank = await Bank.findOne({
    where: {
        code: bankCode,
    },
});

const transaction =
await Transaction.create({

    userId,

    amount,

    reference,

    transactionId: reference,

    transactionType: "withdrawal",

    status: "processing",

    bankCode,

    bankName: bank?.name,

    accountName: resolved.data.account_name,

    accountNumber,

    maskedAccountNumber:
        "******" +
        accountNumber.slice(-4),

});
            

        try {

            const payout =
                await transfer({

                    account_bank: bankCode,

                    account_number:
                        accountNumber,

                    amount,

                    narration:
                        "Wallet Withdrawal",

                    currency: "NGN",

                    reference,

                    beneficiary_name:
                        resolved.data.account_name,

                });

            transaction.flutterwaveId =
                payout.data.id;

            transaction.processorResponse =
                payout.message;

            transaction.gatewayResponse =
                JSON.stringify(
                    payout.data
                );

            await transaction.save();

            return res.json({

                success: true,

                message:
                    "Withdrawal initiated",

                reference,

            });

        }

        catch (transferError) {

            /*
            Flutterwave rejected immediately.

            Refund wallet.
            */

            await refundUser(

                userId,

                amount

            );

            transaction.status =
                "failed";

            transaction.processorResponse =
                transferError.response?.data?.message ||
                transferError.message;

            transaction.gatewayResponse =
                JSON.stringify(

                    transferError.response?.data ||

                    {}

                );

            await transaction.save();

            return res.status(400).json({

                error:
                    "Withdrawal failed",

            });

        }

    }

    catch (err) {

        console.log(

            err.response?.data ||

            err

        );

        return res.status(500).json({

            error:

                "Unable to process withdrawal",

        });

    }

});


async function handleDeposit(
    transaction,
    payload
) {

    const dbTransaction =
        await sequelize.transaction();

    try {

        const status =
            normalizeStatus(
                payload.status
            );

        transaction.flutterwaveId =
            payload.id;

        transaction.paymentType =
            payload.payment_type;

        transaction.processorResponse =
            payload.processor_response;

        transaction.gatewayResponse =
            payload.narration;

        transaction.metadata =
            payload;

        if (
            status === "successful"
        ) {

            await creditUser(

                transaction.userId,

                transaction.amount,

                dbTransaction

            );

            transaction.status =
                "successful";

            transaction.verified = true;

            transaction.verifiedAt =
                new Date();

            transaction.paidAt =
                new Date();

        }

        else {

            transaction.status =
                "failed";

        }

        await transaction.save({

            transaction:
                dbTransaction,

        });

        await dbTransaction.commit();

    }

    catch (err) {

        await dbTransaction.rollback();

        throw err;

    }

}

async function handleWithdrawal(
    transaction,
    payload
) {

    const dbTransaction =
        await sequelize.transaction();

    try {

        const status =
            normalizeStatus(
                payload.status
            );

        transaction.flutterwaveId =
            payload.id;

        transaction.processorResponse =
            payload.complete_message;

        transaction.gatewayResponse =
            payload.status;

        transaction.metadata =
            payload;

        if (
            status === "successful"
        ) {

            transaction.status =
                "successful";

            transaction.verified = true;

            transaction.verifiedAt =
                new Date();

        }

        else {

            /*
            Refund wallet
            */

            await refundUser(

                transaction.userId,

                transaction.amount,

                dbTransaction

            );

            transaction.status =
                "failed";

        }

        await transaction.save({

            transaction:
                dbTransaction,

        });

        await dbTransaction.commit();

    }

    catch (err) {

        await dbTransaction.rollback();

        throw err;

    }

}

const sequelize = require("../db");

router.post("/webhook", async (req, res) => {

    /*
    Verify Flutterwave
    */

    if (!webhookVerified(req))
        return res.sendStatus(401);

    try {

        const payload = req.body;

        const event =
            normalizeEvent(payload.event);

        const data =
            payload.data || {};

        const reference =
            data.tx_ref ||
            data.reference;

        if (!reference)
            return res.sendStatus(200);

        const transaction =
            await Transaction.findOne({

                where: {

                    reference,

                },

            });

        if (!transaction)
            return res.sendStatus(200);

        /*
        Idempotency.

        Never process completed
        transaction twice.
        */

        if (transaction.verified)
            return res.sendStatus(200);

        /*
        Save raw payload.
        */

        transaction.metadata =
            payload;

        if (
            event.includes("charge")
        ) {

            await handleDeposit(

                transaction,

                data

            );

        }

        else if (

            event.includes("transfer")

        ) {

            await handleWithdrawal(

                transaction,

                data

            );

        }

        return res.sendStatus(200);

    }

    catch (err) {

        console.log(err);

        return res.sendStatus(500);

    }

});

module.exports = router;