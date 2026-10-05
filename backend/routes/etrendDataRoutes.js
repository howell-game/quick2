const express = require("express");
const axios = require("axios");

const router = express.Router();

const ETrendAccount =
  require("../models/ETrendAccount");

const ETrendDataTransaction =
  require("../models/ETrendDataTransaction");

const {
  getDataPackages,
  buyData,
  requeryTransaction
} = require("../services/vtpassService");


// ==========================================================
// NETWORKS
// ==========================================================

const NETWORKS = {
  mtn: "mtn-data",
  airtel: "airtel-data",
  glo: "glo-data",
  "9mobile": "etisalat-data"
};


// ==========================================================
// GET DATA PACKAGES
// ==========================================================

router.get("/packages/:network", async (
  req,
  res
) => {
  try {
    const network =
      String(req.params.network)
        .toLowerCase()
        .trim();

    const serviceID =
      NETWORKS[network];

    if (!serviceID) {
      return res.status(400).json({
        success: false,
        message: "Invalid data network."
      });
    }

    const result =
      await getDataPackages(serviceID);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message:
          result.data?.response_description ||
          result.error ||
          "Unable to load data packages."
      });
    }

    const vtpassData =
      result.data;

    const variations =
      vtpassData?.content?.variations;

    if (!Array.isArray(variations)) {
      return res.status(502).json({
        success: false,
        message:
          "VTpass returned no data packages."
      });
    }

    const packages =
      variations
        .filter(
          item =>
            item.fixedPrice === "Yes"
        )
        .map(item => ({
          variationCode:
            item.variation_code,

          name:
            item.name,

          amount:
            Number(
              item.variation_amount
            ),

          fixedPrice:
            item.fixedPrice
        }));

    return res.json({
      success: true,
      network,
      serviceID,
      packages
    });

  } catch (error) {
    console.error(
      "❌ Failed to load ETrend data packages:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load data packages."
    });
  }
});


// ==========================================================
// CHECK FLUTTERWAVE ETrend BALANCE
// ==========================================================

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

  let balance = 0;

  if (Array.isArray(balanceData)) {
    const ngnBalance =
      balanceData.find(
        item =>
          item.currency === "NGN"
      );

    balance = Number(
      ngnBalance?.available ||
      ngnBalance?.available_balance ||
      0
    );

  } else if (balanceData) {
    balance = Number(
      balanceData.available ||
      balanceData.available_balance ||
      0
    );
  }

  return balance;
};


// ==========================================================
// SETTLE DATA PURCHASE
// ==========================================================

const settleDataPurchase = async (
  dataTransaction,
  flutterwaveAccountReference
) => {

  if (
    dataTransaction.status ===
      "SUCCESSFUL" &&
    dataTransaction.flutterwaveTransferReference
  ) {
    return {
      status: "SUCCESSFUL",
      transferReference:
        dataTransaction.flutterwaveTransferReference
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
    dataTransaction.flutterwaveTransferReference ||
    `ETREND_DATA_SETTLE_${dataTransaction.userId}_${Date.now()}`;


  try {

    const transferResponse =
      await axios.post(
        "https://api.flutterwave.com/v3/transfers",
        {
          account_bank:
            "flutterwave",

          account_number:
            String(merchantId),

          amount:
            Number(dataTransaction.amount),

          currency:
            "NGN",

          debit_currency:
            "NGN",

          debit_subaccount:
            flutterwaveAccountReference,

          reference:
            transferReference,

          narration:
            "ETrend Data Purchase Settlement",

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
            ? String(transferData.id)
            : null,

        transferReference
      };
    }


    return {
      status:
        "SETTLEMENT_PROCESSING",

      transferId:
        transferData?.id
          ? String(transferData.id)
          : null,

      transferReference
    };


  } catch (error) {

    console.error(
      "❌ Data settlement transfer failed:"
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
// BUY DATA
// ==========================================================

router.post("/buy", async (
  req,
  res
) => {

  try {

    const {
      userId,
      network,
      phoneNumber,
      variationCode
    } = req.body;


    // ------------------------------------------------------
    // VALIDATE NETWORK
    // ------------------------------------------------------

    const normalizedNetwork =
      String(network || "")
        .toLowerCase()
        .trim();

    const serviceID =
      NETWORKS[normalizedNetwork];

    if (!serviceID) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid network."
      });
    }


    // ------------------------------------------------------
    // VALIDATE PHONE
    // ------------------------------------------------------

    const cleanPhone =
      String(phoneNumber || "")
        .replace(/\s+/g, "")
        .trim();

    if (
      !/^0[789][01]\d{8}$/.test(
        cleanPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Nigerian phone number."
      });
    }


    // ------------------------------------------------------
    // VALIDATE VARIATION CODE
    // ------------------------------------------------------

    if (!variationCode) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a data package."
      });
    }


    // ------------------------------------------------------
    // LOAD CURRENT PACKAGES FROM VTpass
    //
    // This prevents the frontend from changing
    // the package price.
    // ------------------------------------------------------

    const packageResult =
      await getDataPackages(serviceID);

    if (!packageResult.success) {
      return res.status(502).json({
        success: false,
        message:
          "Unable to verify the selected data package."
      });
    }


    const variations =
      packageResult.data?.content?.variations;


    const selectedPackage =
      Array.isArray(variations)
        ? variations.find(
            item =>
              item.variation_code ===
                variationCode &&
              item.fixedPrice ===
                "Yes"
          )
        : null;


    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message:
          "The selected data package is no longer available."
      });
    }


    const amount =
      Number(
        selectedPackage.variation_amount
      );


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid data package price."
      });
    }


    // ------------------------------------------------------
    // FIND ETrend ACCOUNT
    // ------------------------------------------------------

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


    // ------------------------------------------------------
    // CHECK ETrend BALANCE
    // ------------------------------------------------------

    const balance =
      await getFlutterwaveBalance(
        account
      );


    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient ETrend balance."
      });
    }


    // ------------------------------------------------------
    // CREATE LOCAL TRANSACTION
    // ------------------------------------------------------

    const reference =
      `ETREND_DATA_${userId}_${Date.now()}`;


    const dataTransaction =
      await ETrendDataTransaction.create({
        userId,

        reference,

        network:
          normalizedNetwork,

        serviceID,

        variationCode,

        packageName:
          selectedPackage.name,

        phoneNumber:
          cleanPhone,

        amount,

        providerAmount:
          amount,

        status:
          "PENDING"
      });


    // ------------------------------------------------------
    // CALL VTPASS
    // ------------------------------------------------------

    const vtpassResult =
      await buyData({
        serviceID,

        billersCode:
          cleanPhone,

        variationCode,

        amount,

        phone:
          cleanPhone
      });


    const vtpassData =
      vtpassResult.data;


    dataTransaction.requestId =
      vtpassResult.requestId;


    dataTransaction.providerResponse =
      vtpassData;


    if (!vtpassResult.success) {

      dataTransaction.status =
        "FAILED";

      await dataTransaction.save();

      return res.status(502).json({
        success: false,
        message:
          "Data purchase could not be processed.",
        reference,
        requestId:
          vtpassResult.requestId,
        status:
          "FAILED"
      });
    }


    const responseCode =
      vtpassData?.code;

    const providerTransaction =
      vtpassData
        ?.content
        ?.transactions;


    const providerStatus =
      providerTransaction?.status;


    dataTransaction.providerTransactionId =
      providerTransaction?.transactionId
        ? String(
            providerTransaction.transactionId
          )
        : null;


    dataTransaction.commission =
      Number(
        providerTransaction?.commission ||
        0
      );


    // ------------------------------------------------------
    // SUCCESSFUL VTPASS DELIVERY
    // ------------------------------------------------------

    if (
      responseCode === "000" &&
      providerStatus === "delivered"
    ) {

      const settlement =
  await settleDataPurchase(
    dataTransaction,
    account.flutterwaveAccountReference
  );


      // IMPORTANT:
      // settleDataPurchase received a plain object.
      // Save the actual Sequelize transaction here.

      const transferReference =
        settlement.transferReference;


      if (
        settlement.status ===
        "SUCCESSFUL"
      ) {

        dataTransaction.status =
          "SUCCESSFUL";

        dataTransaction.completedAt =
          new Date();

        if (
          transferReference
        ) {
          dataTransaction.flutterwaveTransferReference =
            transferReference;
        }

        await dataTransaction.save();

        return res.json({
          success: true,

          message:
            "Data purchase successful.",

          reference,

          requestId:
            vtpassResult.requestId,

          transaction: {
            network:
              normalizedNetwork,

            packageName:
              selectedPackage.name,

            phoneNumber:
              cleanPhone,

            amount,

            status:
              "SUCCESSFUL",

            commission:
              Number(
                dataTransaction.commission ||
                0
              )
          }
        });
      }


      dataTransaction.status =
        settlement.status;

      if (
        transferReference
      ) {
        dataTransaction.flutterwaveTransferReference =
          transferReference;
      }

      await dataTransaction.save();


      if (
        settlement.status ===
        "SETTLEMENT_PROCESSING"
      ) {
        return res.status(202).json({
          success: true,

          message:
            "Data was delivered. Payment settlement is being completed.",

          reference,

          requestId:
            vtpassResult.requestId,

          status:
            "SETTLEMENT_PROCESSING"
        });
      }


      return res.status(502).json({
        success: false,

        message:
          "Data was delivered, but payment settlement failed.",

        reference,

        requestId:
          vtpassResult.requestId,

        status:
          "SETTLEMENT_FAILED"
      });
    }


    // ------------------------------------------------------
    // PENDING
    // ------------------------------------------------------

    if (
      responseCode === "099" ||
      providerStatus === "pending" ||
      providerStatus === "initiated"
    ) {

      dataTransaction.status =
        "PROCESSING";

      await dataTransaction.save();

      return res.status(202).json({
        success: true,

        message:
          "Data purchase is being processed.",

        reference,

        requestId:
          vtpassResult.requestId,

        status:
          "PROCESSING"
      });
    }


    // ------------------------------------------------------
    // FAILED
    // ------------------------------------------------------

    if (
      responseCode === "016" ||
      responseCode === "091" ||
      responseCode === "028" ||
      responseCode === "010" ||
      responseCode === "011" ||
      responseCode === "012" ||
      responseCode === "013"
    ) {

      dataTransaction.status =
        "FAILED";

      await dataTransaction.save();

      return res.status(400).json({
        success: false,

        message:
          vtpassData?.response_description ||
          "Data purchase failed.",

        reference,

        requestId:
          vtpassResult.requestId,

        status:
          "FAILED"
      });
    }


    // ------------------------------------------------------
    // UNKNOWN RESPONSE
    // ------------------------------------------------------

    dataTransaction.status =
      "PROCESSING";

    await dataTransaction.save();

    return res.status(202).json({
      success: true,

      message:
        "Data purchase is being processed.",

      reference,

      requestId:
        vtpassResult.requestId,

      status:
        "PROCESSING"
    });


  } catch (error) {

    console.error(
      "❌ ETrend data purchase error:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete data purchase."
    });
  }
});


// ==========================================================
// REQUERY DATA TRANSACTION
// ==========================================================

router.post("/requery", async (
  req,
  res
) => {

  try {

    const {
      userId,
      requestId
    } = req.body;


    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          "Request ID is required."
      });
    }


    const transaction =
      await ETrendDataTransaction.findOne({
        where: {
          userId,
          requestId
        }
      });


    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          "Data transaction not found."
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
          "Unable to requery VTpass transaction."
      });
    }


    const vtpassData =
      result.data;


    transaction.providerResponse =
      vtpassData;


    const providerTransaction =
      vtpassData
        ?.content
        ?.transactions;


    const providerStatus =
      providerTransaction?.status;


    transaction.providerTransactionId =
      providerTransaction?.transactionId
        ? String(
            providerTransaction.transactionId
          )
        : transaction.providerTransactionId;


    if (
      providerStatus ===
      "delivered"
    ) {

      transaction.status =
        "SETTLEMENT_PROCESSING";

      await transaction.save();


      const account =
        await ETrendAccount.findOne({
          where: {
            userId
          }
        });


      if (
        !account ||
        !account.flutterwaveAccountReference
      ) {
        transaction.status =
          "SETTLEMENT_FAILED";

        await transaction.save();

        return res.status(500).json({
          success: false,
          message:
            "ETrend Flutterwave account reference is missing.",
          status:
            "SETTLEMENT_FAILED"
        });
      }


      const settlement =
  await settleDataPurchase(
    dataTransaction,
    account.flutterwaveAccountReference
  );


      transaction.status =
        settlement.status;


      if (
        settlement.transferReference
      ) {
        transaction.flutterwaveTransferReference =
          settlement.transferReference;
      }


      await transaction.save();


      return res.json({
        success:
          settlement.status !==
          "SETTLEMENT_FAILED",

        message:
          settlement.status ===
          "SUCCESSFUL"
            ? "Data purchase successful."
            : "Data was delivered. Settlement is still being processed.",

        status:
          settlement.status
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

      await transaction.save();

      return res.json({
        success: true,

        message:
          "Data purchase is still processing.",

        status:
          "PROCESSING"
      });
    }


    transaction.status =
      "FAILED";

    await transaction.save();

    return res.json({
      success: false,

      message:
        vtpassData?.response_description ||
        "Data purchase failed.",

      status:
        "FAILED"
    });


  } catch (error) {

    console.error(
      "❌ ETrend data requery error:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to requery data transaction."
    });
  }
});


module.exports = router;