const express = require("express");
const axios = require("axios");

const ETrendAccount =
  require("../models/ETrendAccount");

const ETrendElectricityTransaction =
  require("../models/ETrendElectricityTransaction");

const {
  verifyElectricityMeter,
  buyElectricity,
  requeryTransaction
} = require("../services/vtpassService");

const router = express.Router();


const ELECTRICITY_PROVIDERS = {
  abuja: "abuja-electric",
  benin: "benin-electric",
  eko: "eko-electric",
  enugu: "enugu-electric",
  ibadan: "ibadan-electric",
  ikeja: "ikeja-electric",
  jos: "jos-electric",
  kaduna: "kaduna-electric",
  kano: "kano-electric",
  portharcourt: "portharcourt-electric",
  yola: "yola-electric"
};


const getFlutterwaveBalance = async (
  account
) => {

  const response =
    await axios.get(
      `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/balances`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type":
            "application/json"
        },
        params: {
          currency: "NGN"
        }
      }
    );

  const balanceData =
    response.data?.data;

  if (
    Array.isArray(
      balanceData
    )
  ) {

    const ngnBalance =
      balanceData.find(
        item =>
          item.currency ===
          "NGN"
      );

    return Number(
      ngnBalance?.available ||
      ngnBalance?.available_balance ||
      0
    );
  }

  return Number(
    balanceData?.available ||
    balanceData?.available_balance ||
    0
  );
};


const settleElectricityPurchase =
  async (
    electricityTransaction,
    flutterwaveAccountReference
  ) => {

    if (
      electricityTransaction.status ===
        "SUCCESSFUL" &&
      electricityTransaction
        .flutterwaveTransferReference
    ) {

      return {
        status:
          "SUCCESSFUL",

        transferReference:
          electricityTransaction
            .flutterwaveTransferReference
      };
    }


    const merchantId =
      process.env.FLUTTERWAVE_MERCHANT_ID;

    if (!merchantId) {

      return {
        status:
          "SETTLEMENT_FAILED"
      };
    }


    const transferReference =
      electricityTransaction
        .flutterwaveTransferReference ||
      `ETREND_ELECTRICITY_SETTLE_${electricityTransaction.userId}_${Date.now()}`;


    try {

      const transferResponse =
        await axios.post(
          "https://api.flutterwave.com/v3/transfers",
          {
            account_bank:
              "flutterwave",

            account_number:
              String(
                merchantId
              ),

            amount:
              Number(
                electricityTransaction.amount
              ),

            currency:
              "NGN",

            debit_currency:
              "NGN",

            debit_subaccount:
              flutterwaveAccountReference,

            reference:
              transferReference,

            narration:
              "ETrend Electricity Payment Settlement",

            callback_url:
              "https://trendgame-backend.onrender.com/api/etrend-account/webhook"
          },
          {
            headers: {
              Authorization:
                `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,

              "Content-Type":
                "application/json"
            },

            timeout: 30000
          }
        );


      const transferData =
        transferResponse.data?.data;


      if (
        transferData?.status ===
        "SUCCESSFUL"
      ) {

        return {
          status:
            "SUCCESSFUL",

          transferId:
            transferData?.id
              ? String(
                  transferData.id
                )
              : null,

          transferReference
        };
      }


      return {
        status:
          "SETTLEMENT_PROCESSING",

        transferId:
          transferData?.id
            ? String(
                transferData.id
              )
            : null,

        transferReference
      };

    } catch (error) {

      console.error(
        "❌ Electricity settlement transfer failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return {
        status:
          "SETTLEMENT_FAILED",

        transferReference,

        error:
          error.response?.data ||
          error.message
      };
    }
  };


// ==========================================================
// PROVIDERS
// ==========================================================

router.get(
  "/providers",
  async (req, res) => {

    return res.json({
      success: true,

      providers:
        Object.entries(
          ELECTRICITY_PROVIDERS
        ).map(
          ([name, serviceID]) => ({
            name,
            serviceID
          })
        )
    });
  }
);


// ==========================================================
// VERIFY METER
// ==========================================================

router.post(
  "/verify",
  async (req, res) => {

    try {

      const {
        provider,
        meterNumber,
        meterType
      } = req.body;


      const normalizedProvider =
        String(
          provider || ""
        ).toLowerCase();


      const serviceID =
        ELECTRICITY_PROVIDERS[
          normalizedProvider
        ];


      if (!serviceID) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid electricity provider."
        });
      }


      if (!meterNumber) {

        return res.status(400).json({
          success: false,
          message:
            "Meter number is required."
        });
      }


      if (
        meterType !==
          "prepaid" &&
        meterType !==
          "postpaid"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Select prepaid or postpaid."
        });
      }


      const result =
        await verifyElectricityMeter({
          serviceID,

          billersCode:
            meterNumber,

          type:
            meterType
        });


      const data =
        result.data;


      if (
        !result.success ||
        data?.code !==
          "000"
      ) {

        return res.status(400).json({
          success: false,

          message:
            data?.response_description ||
            "Unable to verify meter number."
        });
      }


      return res.json({
        success: true,

        provider:
          normalizedProvider,

        serviceID,

        meterType,

        customer:
          data.content ||
          {}
      });

    } catch (error) {

      console.error(
        "❌ Electricity meter verification failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify electricity meter."
      });
    }
  }
);


// ==========================================================
// BUY ELECTRICITY
// ==========================================================

router.post(
  "/buy",
  async (req, res) => {

    try {

      const {
        userId,
        provider,
        meterNumber,
        meterType,
        amount,
        phoneNumber
      } = req.body;


      const normalizedProvider =
        String(
          provider || ""
        ).toLowerCase();


      const serviceID =
        ELECTRICITY_PROVIDERS[
          normalizedProvider
        ];


      if (!userId) {

        return res.status(400).json({
          success: false,
          message:
            "User ID is required."
        });
      }


      if (!serviceID) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid electricity provider."
        });
      }


      if (!meterNumber) {

        return res.status(400).json({
          success: false,
          message:
            "Meter number is required."
        });
      }


      if (
        meterType !==
          "prepaid" &&
        meterType !==
          "postpaid"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Select prepaid or postpaid."
        });
      }


      const electricityAmount =
        Number(amount);


      if (
        !electricityAmount ||
        electricityAmount <= 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Enter a valid electricity amount."
        });
      }


      if (!phoneNumber) {

        return res.status(400).json({
          success: false,
          message:
            "Phone number is required."
        });
      }


      const cleanPhone =
        String(
          phoneNumber
        ).trim();


      if (
        !/^0[789][01]\d{8}$/.test(
          cleanPhone
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Enter a valid Nigerian phone number."
        });
      }


      // ====================================================
      // FIND ETREND ACCOUNT
      // ====================================================

      const account =
        await ETrendAccount.findOne({
          where: {
            userId
          }
        });


      if (!account) {

        return res.status(404).json({
          success: false,
          message:
            "ETrend account not found."
        });
      }


      if (
        !account.flutterwaveAccountReference
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Flutterwave ETrend account reference is missing."
        });
      }


      // ====================================================
      // CHECK REAL BALANCE
      // ====================================================

      const balance =
        await getFlutterwaveBalance(
          account
        );


      if (
        balance <
        electricityAmount
      ) {

        return res.status(400).json({
          success: false,

          message:
            "Insufficient ETrend balance.",

          balance,

          required:
            electricityAmount
        });
      }


      // ====================================================
      // CREATE LOCAL TRANSACTION
      // ====================================================

      const reference =
        `ETREND_ELECTRICITY_${userId}_${Date.now()}`;


      const requestId =
        `${Date.now()}${Math.random()
          .toString(36)
          .substring(2, 12)}`;


      const electricityTransaction =
        await ETrendElectricityTransaction.create({

          userId,

          reference,

          provider:
            normalizedProvider,

          serviceID,

          meterNumber:
            String(
              meterNumber
            ),

          meterType,

          amount:
            electricityAmount,

          providerAmount:
            electricityAmount,

          requestId,

          status:
            "PENDING"
        });


      // ====================================================
      // CALL VTPASS
      // ====================================================

      const vtpassResult =
        await buyElectricity({

          serviceID,

          billersCode:
            meterNumber,

          variationCode:
            meterType,

          amount:
            electricityAmount,

          phone:
            cleanPhone,

          requestId
        });


      const vtpassData =
        vtpassResult.data;


      electricityTransaction
        .providerResponse =
        vtpassData;


      if (
        !vtpassResult.success
      ) {

        electricityTransaction
          .status =
          "FAILED";

        await electricityTransaction.save();

        return res.status(502).json({
          success: false,
          message:
            "Electricity payment request failed.",
          reference,
          requestId,
          status:
            "FAILED"
        });
      }


      const responseCode =
        String(
          vtpassData?.code ||
          ""
        );


      const providerStatus =
        String(
          vtpassData?.content
            ?.transactions
            ?.status ||
          ""
        ).toLowerCase();


      // ====================================================
      // SUCCESSFUL ELECTRICITY PAYMENT
      // ====================================================

      if (
        responseCode ===
          "000" &&
        providerStatus ===
          "delivered"
      ) {

        const transactionData =
          vtpassData?.content
            ?.transactions;


        electricityTransaction
          .providerTransactionId =
          transactionData
            ?.transactionId
            ? String(
                transactionData
                  .transactionId
              )
            : null;


        electricityTransaction
          .commission =
          Number(
            transactionData
              ?.commission ||
            0
          );


        electricityTransaction
          .customerName =
          vtpassData
            ?.customerName ||
          transactionData
            ?.name ||
          null;


        electricityTransaction
          .customerAddress =
          vtpassData
            ?.customerAddress ||
          null;


        electricityTransaction
          .token =
          vtpassData
            ?.purchased_code ||
          transactionData
            ?.purchased_code ||
          null;


        electricityTransaction
          .units =
          transactionData
            ?.units ||
          vtpassData
            ?.units ||
          null;


        // ==================================================
        // SETTLE TO FLUTTERWAVE MERCHANT
        // ==================================================

        const settlement =
          await settleElectricityPurchase(
            electricityTransaction,

            account
              .flutterwaveAccountReference
          );


        if (
          settlement.transferReference
        ) {

          electricityTransaction
            .flutterwaveTransferReference =
            settlement.transferReference;
        }


        if (
          settlement.transferId
        ) {

          electricityTransaction
            .flutterwaveTransferId =
            settlement.transferId;
        }


        electricityTransaction
          .flutterwaveTransferStatus =
          settlement.status;


        if (
          settlement.status ===
          "SUCCESSFUL"
        ) {

          electricityTransaction
            .status =
            "SUCCESSFUL";

          electricityTransaction
            .completedAt =
            new Date();

          await electricityTransaction
            .save();


          return res.json({
            success: true,

            message:
              "Electricity payment successful.",

            reference,

            requestId,

            token:
              electricityTransaction
                .token,

            units:
              electricityTransaction
                .units,

            transaction: {
              provider:
                normalizedProvider,

              meterNumber:
                String(
                  meterNumber
                ),

              meterType,

              amount:
                electricityAmount,

              status:
                "SUCCESSFUL"
            }
          });
        }


        if (
          settlement.status ===
          "SETTLEMENT_PROCESSING"
        ) {

          electricityTransaction
            .status =
            "SETTLEMENT_PROCESSING";

          await electricityTransaction
            .save();


          return res.status(202).json({
            success: true,

            message:
              "Electricity payment was completed. Payment settlement is being finalized.",

            reference,

            requestId,

            token:
              electricityTransaction
                .token,

            units:
              electricityTransaction
                .units,

            status:
              "SETTLEMENT_PROCESSING"
          });
        }


        electricityTransaction
          .status =
          "SETTLEMENT_FAILED";

        await electricityTransaction
          .save();


        return res.status(502).json({
          success: false,

          message:
            "Electricity payment was completed, but payment settlement failed.",

          reference,

          requestId,

          token:
            electricityTransaction
              .token,

          units:
            electricityTransaction
              .units,

          status:
            "SETTLEMENT_FAILED"
        });
      }


      // ====================================================
      // PROCESSING
      // ====================================================

      if (
        responseCode ===
          "099" ||
        providerStatus ===
          "pending" ||
        providerStatus ===
          "initiated"
      ) {

        electricityTransaction
          .status =
          "PROCESSING";

        await electricityTransaction.save();


        return res.status(202).json({
          success: true,

          message:
            "Electricity payment is being processed.",

          reference,

          requestId,

          status:
            "PROCESSING"
        });
      }


      // ====================================================
      // FAILED
      // ====================================================

      electricityTransaction
        .status =
        "FAILED";

      await electricityTransaction
        .save();


      return res.status(400).json({
        success: false,

        message:
          vtpassData
            ?.response_description ||
          "Electricity payment failed.",

        reference,

        requestId,

        status:
          "FAILED"
      });

    } catch (error) {

      console.error(
        "❌ ETrend electricity purchase failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete electricity payment."
      });
    }
  }
);


// ==========================================================
// REQUERY
// ==========================================================

router.post(
  "/requery",
  async (req, res) => {

    try {

      const {
        userId,
        requestId
      } = req.body;


      if (
        !userId ||
        !requestId
      ) {

        return res.status(400).json({
          success: false,
          message:
            "User ID and request ID are required."
        });
      }


      const transaction =
        await ETrendElectricityTransaction
          .findOne({
            where: {
              userId,
              requestId
            }
          });


      if (!transaction) {

        return res.status(404).json({
          success: false,
          message:
            "Electricity transaction not found."
        });
      }


      const result =
        await requeryTransaction(
          requestId
        );


      if (!result.success) {

        return res.status(502).json({
          success: false,
          message:
            "Unable to requery electricity transaction."
        });
      }


      const data =
        result.data;


      transaction.providerResponse =
        data;


      const responseCode =
        String(
          data?.code ||
          ""
        );


      const providerStatus =
        String(
          data?.content
            ?.transactions
            ?.status ||
          ""
        ).toLowerCase();


      if (
        responseCode ===
          "000" &&
        providerStatus ===
          "delivered"
      ) {

        const transactionData =
          data?.content
            ?.transactions;


        transaction.providerTransactionId =
          transactionData
            ?.transactionId
            ? String(
                transactionData
                  .transactionId
              )
            : transaction
                .providerTransactionId;


        transaction.commission =
          Number(
            transactionData
              ?.commission ||
            0
          );


        transaction.customerName =
          data?.customerName ||
          transactionData
            ?.name ||
          transaction.customerName;


        transaction.customerAddress =
          data?.customerAddress ||
          transaction.customerAddress;


        transaction.token =
          data?.purchased_code ||
          transactionData
            ?.purchased_code ||
          transaction.token;


        transaction.units =
          transactionData
            ?.units ||
          data?.units ||
          transaction.units;


        const account =
          await ETrendAccount.findOne({
            where: {
              userId
            }
          });


        if (!account) {

          return res.status(404).json({
            success: false,
            message:
              "ETrend account not found."
          });
        }


        const settlement =
          await settleElectricityPurchase(
            transaction,

            account
              .flutterwaveAccountReference
          );


        if (
          settlement.transferReference
        ) {

          transaction
            .flutterwaveTransferReference =
            settlement.transferReference;
        }


        if (
          settlement.transferId
        ) {

          transaction
            .flutterwaveTransferId =
            settlement.transferId;
        }


        transaction
          .flutterwaveTransferStatus =
          settlement.status;


        if (
          settlement.status ===
          "SUCCESSFUL"
        ) {

          transaction.status =
            "SUCCESSFUL";

          transaction.completedAt =
            transaction.completedAt ||
            new Date();

        } else if (
          settlement.status ===
          "SETTLEMENT_PROCESSING"
        ) {

          transaction.status =
            "SETTLEMENT_PROCESSING";

        } else {

          transaction.status =
            "SETTLEMENT_FAILED";
        }


        await transaction.save();


        return res.json({
          success:
            settlement.status !==
            "SETTLEMENT_FAILED",

          status:
            transaction.status,

          reference:
            transaction.reference,

          requestId,

          token:
            transaction.token,

          units:
            transaction.units
        });
      }


      if (
        providerStatus ===
          "pending" ||
        providerStatus ===
          "initiated"
      ) {

        transaction.status =
          "PROCESSING";

      } else {

        transaction.status =
          "FAILED";
      }


      await transaction.save();


      return res.json({
        success:
          transaction.status !==
          "FAILED",

        status:
          transaction.status,

        reference:
          transaction.reference,

        requestId
      });

    } catch (error) {

      console.error(
        "❌ Electricity requery failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to requery electricity transaction."
      });
    }
  }
);


module.exports = router;