const express = require("express");
const router = express.Router();

const axios = require("axios");

const ETrendAccount = require("../models/ETrendAccount");
const ETrendAirtimeTransaction = require("../models/ETrendAirtimeTransaction");

const {
  buyAirtime,
  requeryTransaction,
  generateRequestId
} = require("../services/vtpassService");


/*
==========================================================
VTpass NETWORK SERVICE IDs
==========================================================
*/

const NETWORKS = {
  mtn: "mtn",
  airtel: "airtel",
  glo: "glo",
  "9mobile": "etisalat"
};


/*
==========================================================
GET AVAILABLE AIRTIME NETWORKS
==========================================================
*/

router.get("/networks", async (req, res) => {
  return res.json({
    success: true,
    networks: [
      {
        name: "MTN",
        serviceID: "mtn"
      },
      {
        name: "Airtel",
        serviceID: "airtel"
      },
      {
        name: "Glo",
        serviceID: "glo"
      },
      {
        name: "9mobile",
        serviceID: "etisalat"
      }
    ]
  });
});


/*
==========================================================
BUY AIRTIME
==========================================================
*/

router.post("/buy", async (req, res) => {
  let airtimeTransaction = null;

  try {
    const {
      userId,
      network,
      phoneNumber,
      amount
    } = req.body;


    /*
    ------------------------------------------------------
    VALIDATE BASIC INPUT
    ------------------------------------------------------
    */

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required."
      });
    }

    if (!network) {
      return res.status(400).json({
        message: "Network is required."
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required."
      });
    }

    if (!amount) {
      return res.status(400).json({
        message: "Airtime amount is required."
      });
    }


    /*
    ------------------------------------------------------
    NORMALIZE NETWORK
    ------------------------------------------------------
    */

    const normalizedNetwork =
      String(network).trim().toLowerCase();

    const serviceID =
      NETWORKS[normalizedNetwork];

    if (!serviceID) {
      return res.status(400).json({
        message:
          "Invalid network. Use MTN, Airtel, Glo or 9mobile."
      });
    }


    /*
    ------------------------------------------------------
    VALIDATE PHONE NUMBER
    ------------------------------------------------------
    */

    const cleanPhone =
      String(phoneNumber)
        .replace(/\s+/g, "")
        .replace(/^\+234/, "0");

    if (!/^0[789][01]\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({
        message:
          "Enter a valid Nigerian phone number."
      });
    }


    /*
    ------------------------------------------------------
    VALIDATE AMOUNT
    ------------------------------------------------------
    */

    const airtimeAmount =
      Number(amount);

    if (
      !Number.isFinite(airtimeAmount) ||
      airtimeAmount <= 0
    ) {
      return res.status(400).json({
        message:
          "Enter a valid airtime amount."
      });
    }


    /*
    ------------------------------------------------------
    MINIMUM AIRTIME AMOUNT
    ------------------------------------------------------
    */

    if (airtimeAmount < 50) {
      return res.status(400).json({
        message:
          "Minimum airtime purchase is ₦50."
      });
    }


    /*
    ------------------------------------------------------
    FIND ETREND ACCOUNT
    ------------------------------------------------------
    */

    const account =
      await ETrendAccount.findOne({
        where: { userId }
      });

    if (!account) {
      return res.status(404).json({
        message:
          "ETrend account not found."
      });
    }


    /*
    ------------------------------------------------------
    FLUTTERWAVE ACCOUNT REFERENCE
    ------------------------------------------------------
    */

    if (!account.flutterwaveAccountReference) {
      return res.status(400).json({
        message:
          "Flutterwave ETrend account reference is missing."
      });
    }


    /*
    ------------------------------------------------------
    CHECK REAL ETREND BALANCE
    ------------------------------------------------------
    */

    const balanceResponse =
      await axios.get(
        `https://api.flutterwave.com/v3/payout-subaccounts/${account.flutterwaveAccountReference}/balances`,
        {
          headers: {
            Authorization:
              `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json"
          },
          params: {
            currency: "NGN"
          }
        }
      );


    const balanceData =
      balanceResponse.data?.data;

    let availableBalance = 0;

    if (Array.isArray(balanceData)) {
      const ngnBalance =
        balanceData.find(
          item => item.currency === "NGN"
        );

      availableBalance =
        Number(
          ngnBalance?.available ||
          ngnBalance?.available_balance ||
          0
        );
    } else if (balanceData) {
      availableBalance =
        Number(
          balanceData.available ||
          balanceData.available_balance ||
          0
        );
    }


    /*
    ------------------------------------------------------
    CHECK BALANCE
    ------------------------------------------------------
    */

    if (availableBalance < airtimeAmount) {
      return res.status(400).json({
        message:
          "Insufficient ETrend balance.",
        balance: availableBalance,
        required: airtimeAmount
      });
    }


    /*
    ------------------------------------------------------
    CREATE UNIQUE ETREND REFERENCE
    ------------------------------------------------------
    */

    const requestId =
      generateRequestId();

    const reference =
      `ETREND_AIRTIME_${userId}_${Date.now()}`;


    /*
    ------------------------------------------------------
    CREATE LOCAL TRANSACTION
    ------------------------------------------------------
    */

    airtimeTransaction =
      await ETrendAirtimeTransaction.create({
        userId,
        reference,
        network: normalizedNetwork,
        phoneNumber: cleanPhone,
        amount: airtimeAmount,
        providerAmount: airtimeAmount,
        commission: 0,
        status: "PENDING",
        providerResponse: {
          requestId
        }
      });


    /*
    ------------------------------------------------------
    SEND AIRTIME PURCHASE TO VTPASS
    ------------------------------------------------------
    */

    const vtpassResult =
      await buyAirtime({
        serviceID,
        phone: cleanPhone,
        amount: airtimeAmount,
        requestId
      });


    /*
    ------------------------------------------------------
    SAVE VTPASS RESPONSE
    ------------------------------------------------------
    */

    const vtpassData =
      vtpassResult.data || null;

    airtimeTransaction.providerResponse =
      vtpassData;


    /*
    ------------------------------------------------------
    VTPASS REQUEST FAILED COMPLETELY
    ------------------------------------------------------
    */

    if (!vtpassResult.success) {
      airtimeTransaction.status = "FAILED";

      await airtimeTransaction.save();

      return res.status(502).json({
        success: false,
        message:
          "Airtime provider could not process the request.",
        reference,
        requestId
      });
    }


    /*
    ------------------------------------------------------
    READ VTPASS RESPONSE
    ------------------------------------------------------
    */

    const responseCode =
      vtpassData?.code;

    const transactionData =
      vtpassData?.content?.transactions;

    const providerStatus =
      transactionData?.status;


    /*
    ------------------------------------------------------
    SAVE PROVIDER TRANSACTION ID
    ------------------------------------------------------
    */

    if (
      transactionData?.transactionId
    ) {
      airtimeTransaction.providerTransactionId =
        String(
          transactionData.transactionId
        );
    }


    /*
    ------------------------------------------------------
    SAVE COMMISSION
    ------------------------------------------------------
    */

    if (
      transactionData?.commission !==
      undefined
    ) {
      airtimeTransaction.commission =
        Number(
          transactionData.commission || 0
        );
    }


    /*
    ------------------------------------------------------
    SUCCESSFUL / DELIVERED
    ------------------------------------------------------
    */

    if (
      responseCode === "000" &&
      providerStatus === "delivered"
    ) {
      airtimeTransaction.status =
        "SUCCESSFUL";

      airtimeTransaction.completedAt =
        new Date();

      await airtimeTransaction.save();

      return res.json({
        success: true,
        message:
          "Airtime purchase successful.",
        reference,
        requestId,
        transaction: {
          network: normalizedNetwork,
          phoneNumber: cleanPhone,
          amount: airtimeAmount,
          status: "SUCCESSFUL",
          commission:
            Number(
              airtimeTransaction.commission || 0
            )
        }
      });
    }


    /*
    ------------------------------------------------------
    PENDING / INITIATED
    ------------------------------------------------------
    */

    if (
      responseCode === "099" ||
      providerStatus === "pending" ||
      providerStatus === "initiated"
    ) {
      airtimeTransaction.status =
        "PROCESSING";

      await airtimeTransaction.save();

      return res.status(202).json({
        success: true,
        message:
          "Airtime purchase is being processed.",
        reference,
        requestId,
        status: "PROCESSING"
      });
    }


    /*
    ------------------------------------------------------
    CLEAR FAILURE
    ------------------------------------------------------
    */

    if (
      responseCode === "016" ||
      responseCode === "091"
    ) {
      airtimeTransaction.status =
        "FAILED";

      await airtimeTransaction.save();

      return res.status(400).json({
        success: false,
        message:
          vtpassData?.response_description ||
          "Airtime purchase failed.",
        reference,
        requestId,
        status: "FAILED"
      });
    }


    /*
    ------------------------------------------------------
    UNKNOWN RESPONSE
    ------------------------------------------------------
    */

    airtimeTransaction.status =
      "PROCESSING";

    await airtimeTransaction.save();

    return res.status(202).json({
      success: true,
      message:
        "Airtime purchase status is unclear. The transaction will be checked.",
      reference,
      requestId,
      status: "PROCESSING"
    });


  } catch (error) {

    console.error(
      "❌ ETrend airtime purchase error:"
    );

    console.error(
      error.response?.data ||
      error.message
    );


    /*
    ------------------------------------------------------
    IF LOCAL TRANSACTION EXISTS
    ------------------------------------------------------
    */

    if (airtimeTransaction) {
      try {

        airtimeTransaction.status =
          "PROCESSING";

        airtimeTransaction.providerResponse =
          error.response?.data ||
          {
            error:
              error.message
          };

        await airtimeTransaction.save();

      } catch (saveError) {

        console.error(
          "❌ Failed to update airtime transaction:"
        );

        console.error(
          saveError.message
        );
      }
    }


    return res.status(500).json({
      success: false,
      message:
        "Unable to process airtime purchase.",
      error:
        error.response?.data?.message ||
        error.message
    });
  }
});


/*
==========================================================
REQUERY AIRTIME TRANSACTION
==========================================================
*/

router.get(
  "/requery/:requestId",
  async (req, res) => {

    try {

      const { requestId } =
        req.params;

      if (!requestId) {
        return res.status(400).json({
          message:
            "Request ID is required."
        });
      }


      const transaction =
        await ETrendAirtimeTransaction.findOne({
          where: {
            providerResponse: {
              requestId
            }
          }
        });


      const result =
        await requeryTransaction(
          requestId
        );


      if (!result.success) {
        return res.status(502).json({
          success: false,
          message:
            "Unable to requery VTpass transaction.",
          requestId
        });
      }


      const data =
        result.data;

      const providerTransaction =
        data?.content?.transactions;

      const status =
        providerTransaction?.status;


      if (transaction) {

        transaction.providerResponse =
          data;

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
              providerTransaction.commission || 0
            );
        }

        if (
          status === "delivered"
        ) {

          transaction.status =
            "SUCCESSFUL";

          transaction.completedAt =
            new Date();

        } else if (
          status === "pending" ||
          status === "initiated"
        ) {

          transaction.status =
            "PROCESSING";

        } else {

          transaction.status =
            "FAILED";
        }

        await transaction.save();
      }


      return res.json({
        success: true,
        requestId,
        status,
        transaction: providerTransaction || null
      });

    } catch (error) {

      console.error(
        "❌ Airtime requery error:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to requery airtime transaction."
      });
    }
  }
);


module.exports = router;