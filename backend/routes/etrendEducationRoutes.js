const express = require("express");
const axios = require("axios");

const router = express.Router();

const ETrendAccount =
  require("../models/ETrendAccount");

const ETrendEducationTransaction =
  require("../models/ETrendEducationTransaction");

const {
  getEducationPackages,
  verifyJAMBProfile,
  buyEducationPIN,
  requeryEducationPIN,
} =
  require("../services/etrendEducationService");


const FLUTTERWAVE_URL =
  "https://api.flutterwave.com/v3";


const MERCHANT_ID =
  process.env.FLUTTERWAVE_MERCHANT_ID ||
  "100660060";


/*
==========================================================
HELPER: GET ETREND ACCOUNT
==========================================================
*/

const getAccount = async (userId) => {

  return await ETrendAccount.findOne({
    where: {
      userId,
    },
  });

};


/*
==========================================================
HELPER: GET REAL ETREND BALANCE
==========================================================
*/

const getEtrendBalance = async (
  accountReference
) => {

  const response =
    await axios.get(
      `${FLUTTERWAVE_URL}/payout-subaccounts/${accountReference}/balances`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

          Accept:
            "application/json",
        },
      }
    );

  const balances =
    response.data?.data || [];

  const ngnBalance =
    balances.find(
      balance =>
        String(
          balance.currency
        ).toUpperCase() === "NGN"
    );

  return Number(
    ngnBalance?.available_balance ||
    ngnBalance?.balance ||
    0
  );
};


/*
==========================================================
GET WAEC / JAMB PACKAGES
==========================================================
*/

router.get(
  "/packages/:serviceID",
  async (req, res) => {

    try {

      const allowedServices = [
        "waec",
        "waec-registration",
        "jamb",
      ];

      const {
        serviceID,
      } = req.params;

      if (
        !allowedServices.includes(
          serviceID
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid education service.",
        });

      }


      const data =
        await getEducationPackages(
          serviceID
        );


      return res.json({
        success: true,
        serviceID,
        packages:
          data?.content?.variations ||
          [],
      });

    } catch (error) {

      console.error(
        "❌ Education packages error:",
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load exam PIN packages.",
      });

    }

  }
);


/*
==========================================================
VERIFY JAMB PROFILE
==========================================================
*/

router.post(
  "/verify-jamb",
  async (req, res) => {

    try {

      const {
        profileId,
        variationCode,
      } = req.body;


      if (
        !profileId ||
        !variationCode
      ) {

        return res.status(400).json({
          success: false,
          message:
            "JAMB Profile ID and PIN type are required.",
        });

      }


      const result =
        await verifyJAMBProfile({
          profileId,
          variationCode,
        });


      if (
        result?.code !== "000"
      ) {

        return res.status(400).json({
          success: false,
          message:
            result?.response_description ||
            "JAMB Profile ID could not be verified.",
        });

      }


      return res.json({
        success: true,

        customerName:
          result?.content?.Customer_Name ||
          "",
      });


    } catch (error) {

      console.error(
        "❌ JAMB verification error:",
        error.response?.data ||
        error.message
      );

      return res.status(400).json({
        success: false,
        message:
          error.response?.data?.response_description ||
          "Unable to verify JAMB Profile ID.",
      });

    }

  }
);


/*
==========================================================
BUY EXAM PIN
==========================================================
*/

router.post(
  "/buy",
  async (req, res) => {

    let transaction = null;

    try {

      const {
        userId,
        examType,
        serviceID,
        variationCode,
        packageName,
        phoneNumber,
        profileId,
        amount,
        quantity = 1,
      } = req.body;


      if (
        !userId ||
        !examType ||
        !serviceID ||
        !variationCode ||
        !phoneNumber ||
        !amount
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Required exam PIN information is missing.",
        });

      }


      const allowedServices = [
        "waec",
        "waec-registration",
        "jamb",
      ];


      if (
        !allowedServices.includes(
          serviceID
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid exam PIN service.",
        });

      }


      if (
        serviceID === "jamb" &&
        !profileId
      ) {

        return res.status(400).json({
          success: false,
          message:
            "JAMB Profile ID is required.",
        });

      }


      /*
       * Find ETrend account.
       */

      const account =
        await getAccount(userId);


      if (!account) {

        return res.status(404).json({
          success: false,
          message:
            "ETrend account not found.",
        });

      }


      if (
        !account.flutterwaveAccountReference
      ) {

        return res.status(400).json({
          success: false,
          message:
            "ETrend Flutterwave account is not ready.",
        });

      }


      /*
       * Confirm the variation still exists.
       * This prevents a user from changing the
       * amount or variation from the frontend.
       */

      const packageResponse =
        await getEducationPackages(
          serviceID
        );


      const variation =
        packageResponse?.content?.variations?.find(
          item =>
            String(
              item.variation_code
            ) ===
            String(
              variationCode
            )
        );


      if (!variation) {

        return res.status(400).json({
          success: false,
          message:
            "Selected exam PIN package is no longer available.",
        });

      }


      const providerAmount =
        Number(
          variation.variation_amount
        );


      const requestedAmount =
        Number(amount);


      if (
        !Number.isFinite(
          providerAmount
        ) ||
        providerAmount <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid provider package price.",
        });

      }


      /*
       * Use the provider's actual package price.
       */

      if (
        Math.abs(
          requestedAmount -
          providerAmount
        ) > 0.01
      ) {

        return res.status(400).json({
          success: false,
          message:
            "The selected package price has changed. Please reload the packages.",
        });

      }


      /*
       * Get real ETrend balance.
       */

      const balance =
        await getEtrendBalance(
          account.flutterwaveAccountReference
        );


      const totalAmount =
        Number(
          (
            providerAmount *
            Number(quantity)
          ).toFixed(2)
        );


      if (
        balance < totalAmount
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Insufficient ETrend balance.",
          balance,
          required:
            totalAmount,
        });

      }


      /*
       * Create our local transaction first.
       */

      const reference =
        `ETREND_EXAM_${userId}_${Date.now()}`;


      transaction =
        await ETrendEducationTransaction.create({
          userId,

          reference,

          examType,

          serviceID,

          variationCode,

          packageName:
            packageName ||
            variation.name,

          phoneNumber:
            String(phoneNumber),

          profileId:
            profileId
              ? String(profileId)
              : null,

          customerName:
            null,

          amount:
            totalAmount,

          providerAmount,

          commission: 0,

          status:
            "PENDING",
        });


      /*
       * JAMB Profile ID verification.
       */

      if (
        serviceID === "jamb"
      ) {

        const verification =
          await verifyJAMBProfile({
            profileId,
            variationCode,
          });


        if (
          verification?.code !==
          "000"
        ) {

          transaction.status =
            "FAILED";

          transaction.providerResponse =
            verification;

          await transaction.save();

          return res.status(400).json({
            success: false,
            message:
              verification?.response_description ||
              "JAMB Profile ID verification failed.",
          });

        }


        transaction.customerName =
          verification?.content?.Customer_Name ||
          null;

        await transaction.save();

      }


      /*
       * Purchase from VTpass.
       */

      const purchase =
        await buyEducationPIN({
          serviceID,
          variationCode,
          amount:
            providerAmount,
          phone:
            String(phoneNumber),
          profileId,
          quantity,
        });


      const vtpassData =
        purchase.data;

      transaction.requestId =
        purchase.requestId;

      transaction.providerResponse =
        vtpassData;


      const providerTransaction =
        vtpassData?.content?.transactions;

      const providerStatus =
        providerTransaction?.status;


      if (
        providerTransaction?.transactionId
      ) {

        transaction.providerTransactionId =
          String(
            providerTransaction.transactionId
          );

      }


      if (
        providerTransaction?.commission !==
        undefined
      ) {

        transaction.commission =
          Number(
            providerTransaction.commission ||
            0
          );

      }


      /*
       * Provider successfully delivered.
       */

      if (
        vtpassData?.code === "000" &&
        providerStatus === "delivered"
      ) {

        transaction.status =
          "SETTLEMENT_PROCESSING";


        /*
         * Save returned PIN/token.
         */

        const cards =
          Array.isArray(
            vtpassData?.cards
          )
            ? vtpassData.cards
            : [];


        if (cards.length > 0) {

          transaction.serialNumber =
            cards[0]?.Serial ||
            null;

          transaction.pin =
            cards[0]?.Pin ||
            null;

        }


        if (
          vtpassData?.Pin
        ) {

          transaction.pin =
            String(
              vtpassData.Pin
            );

        }


        if (
          vtpassData?.purchased_code
        ) {

          transaction.token =
            String(
              vtpassData.purchased_code
            );

        }


        if (
          Array.isArray(
            vtpassData?.tokens
          ) &&
          vtpassData.tokens.length > 0
        ) {

          transaction.token =
            vtpassData.tokens.join(
              ", "
            );

        }


        await transaction.save();


        /*
         * Now settle the exact amount
         * from the ETrend subaccount
         * to Flutterwave merchant account.
         */

        const transferReference =
          `ETREND_EXAM_SETTLE_${userId}_${Date.now()}`;


        const transferResponse =
          await axios.post(
            `${FLUTTERWAVE_URL}/transfers`,
            {
              account_bank:
                "flutterwave",

              account_number:
                String(MERCHANT_ID),

              amount:
                totalAmount,

              currency:
                "NGN",

              debit_currency:
                "NGN",

              debit_subaccount:
                account.flutterwaveAccountReference,

              reference:
                transferReference,

              narration:
                "ETrend Exam PIN Purchase Settlement",

              callback_url:
                "https://trendgame-backend.onrender.com/api/etrend-education/webhook",
            },
            {
              headers: {
                Authorization:
                  `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },
            }
          );


        const transfer =
          transferResponse.data?.data;


        transaction.flutterwaveTransferId =
          transfer?.id
            ? String(transfer.id)
            : null;

        transaction.flutterwaveTransferReference =
          transferReference;

        transaction.flutterwaveTransferStatus =
          String(
            transfer?.status ||
            "NEW"
          )
            .trim()
            .toUpperCase();


        if (
          transaction.flutterwaveTransferStatus ===
          "SUCCESSFUL"
        ) {

          transaction.status =
            "SUCCESSFUL";

          transaction.completedAt =
            new Date();

        }


        await transaction.save();


        return res.json({
          success: true,

          message:
            transaction.status ===
            "SUCCESSFUL"
              ? "Exam PIN purchase successful."
              : "Exam PIN purchased and settlement is being processed.",

          reference,

          status:
            transaction.status,

          examType,

          packageName:
            transaction.packageName,

          customerName:
            transaction.customerName,

          serialNumber:
            transaction.serialNumber,

          pin:
            transaction.pin,

          token:
            transaction.token,

          requestId:
            transaction.requestId,
        });

      }


      /*
       * VTpass is processing.
       */

      if (
        vtpassData?.code === "099" ||
        providerStatus === "pending" ||
        providerStatus === "initiated"
      ) {

        transaction.status =
          "PROCESSING";

        await transaction.save();

        return res.status(202).json({
          success: true,

          message:
            "Exam PIN purchase is being processed.",

          reference,

          requestId:
            transaction.requestId,

          status:
            "PROCESSING",
        });

      }


      transaction.status =
        "FAILED";

      await transaction.save();

      return res.status(400).json({
        success: false,

        message:
          vtpassData?.response_description ||
          "Exam PIN purchase failed.",

        reference,

        requestId:
          transaction.requestId,

        status:
          "FAILED",
      });


    } catch (error) {

      console.error(
        "❌ ETrend exam PIN purchase error:"
      );

      console.error(
        error.response?.data ||
        error.message
      );


      if (transaction) {

        transaction.status =
          "PROCESSING";

        transaction.providerResponse =
          error.response?.data ||
          {
            error:
              error.message,
          };

        await transaction.save();

      }


      return res.status(500).json({
        success: false,

        message:
          "Exam PIN purchase could not be completed.",

        reference:
          transaction?.reference ||
          null,
      });

    }

  }
);


/*
==========================================================
REQUERY
==========================================================
*/

router.post(
  "/requery",
  async (req, res) => {

    try {

      const {
        userId,
        reference,
      } = req.body;


      const transaction =
        await ETrendEducationTransaction.findOne({
          where: {
            userId,
            reference,
          },
        });


      if (!transaction) {

        return res.status(404).json({
          success: false,
          message:
            "Exam PIN transaction not found.",
        });

      }


      if (
        !transaction.requestId
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Provider request ID is missing.",
        });

      }


      const result =
        await requeryEducationPIN(
          transaction.requestId
        );


      transaction.providerResponse =
        result;


      const providerTransaction =
        result?.content?.transactions;


      if (
        providerTransaction?.transactionId
      ) {

        transaction.providerTransactionId =
          String(
            providerTransaction.transactionId
          );

      }


      if (
        result?.code === "000" &&
        providerTransaction?.status ===
          "delivered"
      ) {

        const cards =
          Array.isArray(
            result?.cards
          )
            ? result.cards
            : [];


        if (cards.length > 0) {

          transaction.serialNumber =
            cards[0]?.Serial ||
            transaction.serialNumber;

          transaction.pin =
            cards[0]?.Pin ||
            transaction.pin;

        }


        if (
          result?.Pin
        ) {

          transaction.pin =
            String(
              result.Pin
            );

        }


        if (
          result?.purchased_code
        ) {

          transaction.token =
            String(
              result.purchased_code
            );

        }


        if (
          Array.isArray(
            result?.tokens
          ) &&
          result.tokens.length
        ) {

          transaction.token =
            result.tokens.join(
              ", "
            );

        }


        transaction.status =
          "SETTLEMENT_PROCESSING";

      }


      await transaction.save();


      return res.json({
        success: true,

        status:
          transaction.status,

        serialNumber:
          transaction.serialNumber,

        pin:
          transaction.pin,

        token:
          transaction.token,

        providerResponse:
          result,
      });


    } catch (error) {

      console.error(
        "❌ Exam PIN requery error:",
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to requery exam PIN transaction.",
      });

    }

  }
);


/*
==========================================================
TRANSACTION HISTORY
==========================================================
*/

router.get(
  "/transactions/:userId",
  async (req, res) => {

    try {

      const transactions =
        await ETrendEducationTransaction.findAll({
          where: {
            userId:
              req.params.userId,
          },

          order: [
            ["createdAt", "DESC"],
          ],

          limit: 100,
        });


      return res.json({
        success: true,
        transactions,
      });

    } catch (error) {

      console.error(
        "❌ Education history error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load exam PIN history.",
      });

    }

  }
);


/*
==========================================================
FLUTTERWAVE EDUCATION SETTLEMENT WEBHOOK
==========================================================
*/

router.post(
  "/webhook",
  async (req, res) => {

    try {

      const receivedHash =
        req.headers["verif-hash"];

      const secretHash =
        process.env.FLW_SECRET_HASH;


      if (
        !receivedHash ||
        !secretHash ||
        receivedHash !== secretHash
      ) {

        return res.sendStatus(401);

      }


      const event =
        req.body?.event;

      const transfer =
        req.body?.data;


      if (
        event !==
        "transfer.completed" ||
        !transfer
      ) {

        return res.sendStatus(200);

      }


      const reference =
        transfer.reference;


      if (!reference) {

        return res.sendStatus(200);

      }


      const transaction =
        await ETrendEducationTransaction.findOne({
          where: {
            flutterwaveTransferReference:
              reference,
          },
        });


      if (!transaction) {

        return res.sendStatus(200);

      }


      const transferId =
        transfer.id;


      const transferStatus =
        String(
          transfer.status ||
          ""
        )
          .trim()
          .toUpperCase();


      if (transferId) {

        transaction.flutterwaveTransferId =
          String(transferId);

      }


      transaction.flutterwaveTransferStatus =
        transferStatus;


      if (
        transferStatus ===
        "SUCCESSFUL"
      ) {

        transaction.status =
          "SUCCESSFUL";

        transaction.completedAt =
          transaction.completedAt ||
          new Date();

      } else if (
        transferStatus ===
        "FAILED"
      ) {

        transaction.status =
          "SETTLEMENT_FAILED";

      } else {

        transaction.status =
          "SETTLEMENT_PROCESSING";

      }


      await transaction.save();


      return res.sendStatus(200);

    } catch (error) {

      console.error(
        "❌ Education webhook error:",
        error.message
      );

      return res.sendStatus(200);

    }

  }
);


module.exports = router;