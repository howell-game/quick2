const express = require("express");
const axios = require("axios");

const ETrendAccount =
  require("../models/ETrendAccount");

const ETrendTVTransaction =
  require("../models/ETrendTVTransaction");

const {
  getTVPackages,
  verifyTVSmartcard,
  buyTV,
  requeryTransaction
} = require("../services/vtpassService");

const router = express.Router();


const TV_PROVIDERS = {
  dstv: "dstv",
  gotv: "gotv",
  startimes: "startimes"
};


const getFlutterwaveBalance = async (
  account
) => {
  const response = await axios.get(
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
    response.data?.data;

  if (Array.isArray(balanceData)) {
    const ngnBalance =
      balanceData.find(
        item => item.currency === "NGN"
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


const settleTVPurchase = async (
  tvTransaction,
  flutterwaveAccountReference
) => {

  if (
    tvTransaction.status === "SUCCESSFUL" &&
    tvTransaction.flutterwaveTransferReference
  ) {
    return {
      status: "SUCCESSFUL",
      transferReference:
        tvTransaction.flutterwaveTransferReference
    };
  }

  const merchantId =
    process.env.FLUTTERWAVE_MERCHANT_ID;

  if (!merchantId) {
    return {
      status: "SETTLEMENT_FAILED"
    };
  }

  const transferReference =
    tvTransaction.flutterwaveTransferReference ||
    `ETREND_TV_SETTLE_${tvTransaction.userId}_${Date.now()}`;

  try {

    const transferResponse =
      await axios.post(
        "https://api.flutterwave.com/v3/transfers",
        {
          account_bank: "flutterwave",
          account_number:
            String(merchantId),
          amount:
            Number(tvTransaction.amount),
          currency: "NGN",
          debit_currency: "NGN",
          debit_subaccount:
            flutterwaveAccountReference,
          reference:
            transferReference,
          narration:
            "ETrend TV Subscription Settlement",
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
        status: "SUCCESSFUL",

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
      "❌ TV settlement transfer failed:"
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
// GET TV PACKAGES
// ==========================================================

router.get(
  "/packages/:provider",
  async (req, res) => {

    try {

      const provider =
        String(
          req.params.provider
        ).toLowerCase();

      const serviceID =
        TV_PROVIDERS[provider];

      if (!serviceID) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid TV provider."
        });
      }

      const result =
        await getTVPackages(
          serviceID
        );

      if (!result.success) {
        return res.status(502).json({
          success: false,
          message:
            "Unable to load TV packages.",
          error: result.error
        });
      }

      return res.json({
        success: true,
        provider,
        serviceID,
        packages:
          result.data?.content?.variations ||
          []
      });

    } catch (error) {

      console.error(
        "❌ Failed to load TV packages:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load TV packages."
      });
    }
  }
);


// ==========================================================
// VERIFY SMARTCARD
// ==========================================================

router.post(
  "/verify",
  async (req, res) => {

    try {

      const {
        provider,
        smartcardNumber
      } = req.body;

      const normalizedProvider =
        String(
          provider || ""
        ).toLowerCase();

      const serviceID =
        TV_PROVIDERS[
          normalizedProvider
        ];

      if (!serviceID) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid TV provider."
        });
      }

      if (!smartcardNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Smartcard number is required."
        });
      }

      const result =
        await verifyTVSmartcard({
          serviceID,
          billersCode:
            smartcardNumber
        });

      const data =
        result.data;

      if (
        !result.success ||
        data?.code !== "000"
      ) {
        return res.status(400).json({
          success: false,
          message:
            data?.response_description ||
            "Unable to verify smartcard number."
        });
      }

      return res.json({
        success: true,
        provider:
          normalizedProvider,
        serviceID,

        customer:
          data.content || {}
      });

    } catch (error) {

      console.error(
        "❌ TV smartcard verification failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify smartcard number."
      });
    }
  }
);


// ==========================================================
// BUY TV SUBSCRIPTION
// ==========================================================

router.post(
  "/buy",
  async (req, res) => {

    try {

      const {
        userId,
        provider,
        smartcardNumber,
        variationCode,
        phoneNumber,
        subscriptionType
      } = req.body;

      const normalizedProvider =
        String(
          provider || ""
        ).toLowerCase();

      const serviceID =
        TV_PROVIDERS[
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
            "Invalid TV provider."
        });
      }

      if (!smartcardNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Smartcard number is required."
        });
      }

      if (!variationCode) {
        return res.status(400).json({
          success: false,
          message:
            "TV package is required."
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
        String(phoneNumber).trim();

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
      // LOAD CURRENT PACKAGES
      // ====================================================

      const packageResult =
        await getTVPackages(
          serviceID
        );

      if (!packageResult.success) {
        return res.status(502).json({
          success: false,
          message:
            "Unable to verify the selected TV package."
        });
      }

      const variations =
        packageResult.data?.content
          ?.variations || [];

      const selectedVariation =
        variations.find(
          item =>
            String(
              item.variation_code
            ) === String(variationCode)
        );

      if (!selectedVariation) {
        return res.status(400).json({
          success: false,
          message:
            "Selected TV package is invalid."
        });
      }

      const amount =
        Number(
          selectedVariation.variation_amount
        );

      if (
        !amount ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid TV package amount."
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
      // CHECK REAL ETREND BALANCE
      // ====================================================

      const balance =
        await getFlutterwaveBalance(
          account
        );

      if (balance < amount) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient ETrend balance.",
          balance,
          required:
            amount
        });
      }


      // ====================================================
      // CREATE LOCAL TRANSACTION
      // ====================================================

      const reference =
        `ETREND_TV_${userId}_${Date.now()}`;

      const requestId =
        `${Date.now()}${Math.random()
          .toString(36)
          .substring(2, 12)}`;

      const tvTransaction =
        await ETrendTVTransaction.create({
          userId,

          reference,

          provider:
            normalizedProvider,

          serviceID,

          smartcardNumber:
            String(
              smartcardNumber
            ),

          variationCode:
            String(
              variationCode
            ),

          packageName:
            selectedVariation.name,

          subscriptionType:
            subscriptionType ===
            "renew"
              ? "renew"
              : "change",

          amount,

          providerAmount:
            amount,

          requestId,

          status: "PENDING"
        });


      // ====================================================
      // CALL VTPASS
      // ====================================================

      const vtpassResult =
        await buyTV({
          serviceID,

          billersCode:
            smartcardNumber,

          variationCode,

          amount,

          phone:
            cleanPhone,

          requestId,

          subscriptionType:
            tvTransaction.subscriptionType
        });

      const vtpassData =
        vtpassResult.data;

      tvTransaction.providerResponse =
        vtpassData;


      if (!vtpassResult.success) {

        tvTransaction.status =
          "FAILED";

        await tvTransaction.save();

        return res.status(502).json({
          success: false,
          message:
            "TV subscription request failed.",
          reference,
          requestId,
          status: "FAILED"
        });
      }


      const responseCode =
        String(
          vtpassData?.code || ""
        );

      const providerStatus =
        String(
          vtpassData?.content
            ?.transactions
            ?.status || ""
        ).toLowerCase();


      // ====================================================
      // SUCCESSFUL VTpass PURCHASE
      // ====================================================

      if (
        responseCode === "000" &&
        providerStatus ===
          "delivered"
      ) {

        tvTransaction.providerTransactionId =
          vtpassData?.content
            ?.transactions
            ?.transactionId
            ? String(
                vtpassData.content
                  .transactions
                  .transactionId
              )
            : null;

        tvTransaction.commission =
          Number(
            vtpassData?.content
              ?.transactions
              ?.commission || 0
          );

        tvTransaction.customerName =
          vtpassData?.content
            ?.transactions
            ?.name || null;


        // ==============================================
        // SETTLE CUSTOMER MONEY TO FLUTTERWAVE MERCHANT
        // ==============================================

        const settlement =
          await settleTVPurchase(
            tvTransaction,
            account.flutterwaveAccountReference
          );


        if (
          settlement.transferReference
        ) {
          tvTransaction.flutterwaveTransferReference =
            settlement.transferReference;
        }

        if (
          settlement.transferId
        ) {
          tvTransaction.flutterwaveTransferId =
            settlement.transferId;
        }

        tvTransaction.flutterwaveTransferStatus =
          settlement.status;


        if (
          settlement.status ===
          "SUCCESSFUL"
        ) {

          tvTransaction.status =
            "SUCCESSFUL";

          tvTransaction.completedAt =
            new Date();

          await tvTransaction.save();

          return res.json({
            success: true,
            message:
              "TV subscription successful.",
            reference,
            requestId,
            transaction: {
              provider:
                normalizedProvider,

              smartcardNumber:
                String(
                  smartcardNumber
                ),

              packageName:
                selectedVariation.name,

              amount,

              status:
                "SUCCESSFUL"
            }
          });
        }


        if (
          settlement.status ===
          "SETTLEMENT_PROCESSING"
        ) {

          tvTransaction.status =
            "SETTLEMENT_PROCESSING";

          await tvTransaction.save();

          return res.status(202).json({
            success: true,
            message:
              "TV subscription was completed. Payment settlement is being finalized.",
            reference,
            requestId,
            status:
              "SETTLEMENT_PROCESSING"
          });
        }


        tvTransaction.status =
          "SETTLEMENT_FAILED";

        await tvTransaction.save();

        return res.status(502).json({
          success: false,
          message:
            "TV subscription was delivered, but payment settlement failed.",
          reference,
          requestId,
          status:
            "SETTLEMENT_FAILED"
        });
      }


      // ====================================================
      // PROCESSING
      // ====================================================

      if (
        responseCode === "099" ||
        providerStatus ===
          "pending" ||
        providerStatus ===
          "initiated"
      ) {

        tvTransaction.status =
          "PROCESSING";

        await tvTransaction.save();

        return res.status(202).json({
          success: true,
          message:
            "TV subscription is being processed.",
          reference,
          requestId,
          status:
            "PROCESSING"
        });
      }


      // ====================================================
      // FAILED
      // ====================================================

      tvTransaction.status =
        "FAILED";

      await tvTransaction.save();

      return res.status(400).json({
        success: false,
        message:
          vtpassData?.response_description ||
          "TV subscription failed.",
        reference,
        requestId,
        status: "FAILED"
      });

    } catch (error) {

      console.error(
        "❌ ETrend TV purchase failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to complete TV subscription."
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

      if (!userId || !requestId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID and request ID are required."
        });
      }

      const tvTransaction =
        await ETrendTVTransaction.findOne({
          where: {
            userId,
            requestId
          }
        });

      if (!tvTransaction) {
        return res.status(404).json({
          success: false,
          message:
            "TV transaction not found."
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
            "Unable to requery TV transaction."
        });
      }

      const data =
        result.data;

      tvTransaction.providerResponse =
        data;

      const responseCode =
        String(
          data?.code || ""
        );

      const providerStatus =
        String(
          data?.content
            ?.transactions
            ?.status || ""
        ).toLowerCase();


      if (
        responseCode === "000" &&
        providerStatus ===
          "delivered"
      ) {

        tvTransaction.providerTransactionId =
          data?.content
            ?.transactions
            ?.transactionId
            ? String(
                data.content
                  .transactions
                  .transactionId
              )
            : tvTransaction.providerTransactionId;

        tvTransaction.commission =
          Number(
            data?.content
              ?.transactions
              ?.commission || 0
          );

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
          await settleTVPurchase(
            tvTransaction,
            account.flutterwaveAccountReference
          );

        if (
          settlement.transferReference
        ) {
          tvTransaction.flutterwaveTransferReference =
            settlement.transferReference;
        }

        if (
          settlement.transferId
        ) {
          tvTransaction.flutterwaveTransferId =
            settlement.transferId;
        }

        tvTransaction.flutterwaveTransferStatus =
          settlement.status;

        if (
          settlement.status ===
          "SUCCESSFUL"
        ) {
          tvTransaction.status =
            "SUCCESSFUL";

          tvTransaction.completedAt =
            new Date();
        } else if (
          settlement.status ===
          "SETTLEMENT_PROCESSING"
        ) {
          tvTransaction.status =
            "SETTLEMENT_PROCESSING";
        } else {
          tvTransaction.status =
            "SETTLEMENT_FAILED";
        }

        await tvTransaction.save();

        return res.json({
          success:
            settlement.status !==
            "SETTLEMENT_FAILED",

          status:
            tvTransaction.status,

          reference:
            tvTransaction.reference,

          requestId
        });
      }


      if (
        providerStatus ===
          "pending" ||
        providerStatus ===
          "initiated"
      ) {

        tvTransaction.status =
          "PROCESSING";

      } else {

        tvTransaction.status =
          "FAILED";
      }

      await tvTransaction.save();

      return res.json({
        success:
          tvTransaction.status !==
          "FAILED",

        status:
          tvTransaction.status,

        reference:
          tvTransaction.reference,

        requestId
      });

    } catch (error) {

      console.error(
        "❌ TV requery failed:"
      );

      console.error(
        error.response?.data ||
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to requery TV transaction."
      });
    }
  }
);


module.exports = router;