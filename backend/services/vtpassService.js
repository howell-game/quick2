const axios = require("axios");
const VTPASS_BASE_URL = process.env.VTPASS_BASE_URL || "https://sandbox.vtpass.com/api";

const generateRequestId = () => {
  const now = new Date();

  const lagosTime = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Africa/Lagos"
    })
  );

  const year = lagosTime.getFullYear();
  const month = String(lagosTime.getMonth() + 1).padStart(2, "0");
  const day = String(lagosTime.getDate()).padStart(2, "0");
  const hours = String(lagosTime.getHours()).padStart(2, "0");
  const minutes = String(lagosTime.getMinutes()).padStart(2, "0");

  const timestamp =
    `${year}${month}${day}${hours}${minutes}`;

  const randomPart =
    Math.random().toString(36).substring(2, 12);

  return `${timestamp}${randomPart}`;
};


// ==========================================================
// AIRTIME
// ==========================================================

const buyAirtime = async ({
  serviceID,
  phone,
  amount,
  requestId
}) => {
  if (!serviceID) {
    throw new Error("VTpass service ID is required.");
  }

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "A valid airtime amount is required."
    );
  }

  const finalRequestId =
    requestId || generateRequestId();

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/pay`,
      {
        request_id: finalRequestId,
        serviceID,
        amount: Number(amount),
        phone: String(phone)
      },
      {
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      requestId: finalRequestId,
      data: response.data
    };

  } catch (error) {
    console.error(
      "❌ VTpass airtime request failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      requestId: finalRequestId,
      data:
        error.response?.data ||
        null,
      error: error.message
    };
  }
};


// ==========================================================
// DATA - GET PACKAGES
// ==========================================================

const getDataPackages = async (serviceID) => {
  if (!serviceID) {
    throw new Error(
      "VTpass data service ID is required."
    );
  }

  try {
    const response = await axios.get(
      `${VTPASS_BASE_URL}/service-variations`,
      {
        params: {
          serviceID
        },

        headers: {
          "api-key":
            process.env.VTPASS_API_KEY,

          "secret-key":
            process.env.VTPASS_SECRET_KEY,

          "Content-Type":
            "application/json"
        },

        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error(
      "❌ VTpass data packages request failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      data:
        error.response?.data ||
        null,
      error: error.message
    };
  }
};


// ==========================================================
// DATA - BUY
// ==========================================================

const buyData = async ({
  serviceID,
  billersCode,
  variationCode,
  amount,
  phone,
  requestId
}) => {
  if (!serviceID) {
    throw new Error(
      "VTpass data service ID is required."
    );
  }

  if (!billersCode) {
    throw new Error(
      "Data recipient phone number is required."
    );
  }

  if (!variationCode) {
    throw new Error(
      "Data variation code is required."
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "A valid data amount is required."
    );
  }

  if (!phone) {
    throw new Error(
      "Customer phone number is required."
    );
  }

  const finalRequestId =
    requestId || generateRequestId();

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/pay`,
      {
        request_id: finalRequestId,
        serviceID,
        billersCode: String(billersCode),
        variation_code: variationCode,
        amount: Number(amount),
        phone: String(phone)
      },
      {
        headers: {
          "api-key":
            process.env.VTPASS_API_KEY,

          "secret-key":
            process.env.VTPASS_SECRET_KEY,

          "Content-Type":
            "application/json"
        },

        timeout: 30000
      }
    );

    return {
      success: true,
      requestId: finalRequestId,
      data: response.data
    };

  } catch (error) {
    console.error(
      "❌ VTpass data purchase failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      requestId: finalRequestId,
      data:
        error.response?.data ||
        null,
      error: error.message
    };
  }
};


// ==========================================================
// REQUERY
// ==========================================================

const requeryTransaction = async (
  requestId
) => {
  if (!requestId) {
    throw new Error(
      "VTpass request ID is required."
    );
  }

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/requery`,
      {
        request_id: requestId
      },
      {
        headers: {
          "api-key":
            process.env.VTPASS_API_KEY,

          "secret-key":
            process.env.VTPASS_SECRET_KEY,

          "Content-Type":
            "application/json"
        },

        timeout: 30000
      }
    );

    return {
      success: true,
      requestId,
      data: response.data
    };

  } catch (error) {
    console.error(
      "❌ VTpass transaction requery failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      requestId,

      data:
        error.response?.data ||
        null,

      error: error.message
    };
  }
};

const getTVPackages = async (serviceID) => {
  if (!serviceID) {
    throw new Error("VTpass TV service ID is required.");
  }

  try {
    const response = await axios.get(
      `${VTPASS_BASE_URL}/service-variations`,
      {
        params: {
          serviceID
        },
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("❌ VTpass TV packages request failed:");
    console.error(
      error.response?.data || error.message
    );

    return {
      success: false,
      data: error.response?.data || null,
      error: error.message
    };
  }
};


const verifyTVSmartcard = async ({
  serviceID,
  billersCode
}) => {
  if (!serviceID) {
    throw new Error("VTpass TV service ID is required.");
  }

  if (!billersCode) {
    throw new Error("Smartcard number is required.");
  }

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/merchant-verify`,
      {
        serviceID,
        billersCode: String(billersCode)
      },
      {
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error("❌ VTpass TV smartcard verification failed:");
    console.error(
      error.response?.data || error.message
    );

    return {
      success: false,
      data: error.response?.data || null,
      error: error.message
    };
  }
};


const buyTV = async ({
  serviceID,
  billersCode,
  variationCode,
  amount,
  phone,
  requestId,
  subscriptionType = "change"
}) => {
  if (!serviceID) {
    throw new Error("VTpass TV service ID is required.");
  }

  if (!billersCode) {
    throw new Error("Smartcard number is required.");
  }

  if (!variationCode) {
    throw new Error("TV package is required.");
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error("A valid TV subscription amount is required.");
  }

  if (!phone) {
    throw new Error("Customer phone number is required.");
  }

  const finalRequestId =
    requestId || generateRequestId();

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/pay`,
      {
        request_id: finalRequestId,
        serviceID,
        billersCode: String(billersCode),
        variation_code: variationCode,
        amount: Number(amount),
        phone: String(phone),
        subscription_type: subscriptionType
      },
      {
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      requestId: finalRequestId,
      data: response.data
    };
  } catch (error) {
    console.error("❌ VTpass TV purchase failed:");
    console.error(
      error.response?.data || error.message
    );

    return {
      success: false,
      requestId: finalRequestId,
      data: error.response?.data || null,
      error: error.message
    };
  }
};

const verifyElectricityMeter = async ({
  serviceID,
  billersCode,
  type
}) => {
  if (!serviceID) {
    throw new Error(
      "VTpass electricity service ID is required."
    );
  }

  if (!billersCode) {
    throw new Error(
      "Electricity meter number is required."
    );
  }

  if (
    type !== "prepaid" &&
    type !== "postpaid"
  ) {
    throw new Error(
      "Electricity meter type must be prepaid or postpaid."
    );
  }

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/merchant-verify`,
      {
        serviceID,
        billersCode: String(billersCode),
        type
      },
      {
        headers: {
          "api-key":
            process.env.VTPASS_API_KEY,
          "secret-key":
            process.env.VTPASS_SECRET_KEY,
          "Content-Type":
            "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(
      "❌ VTpass electricity meter verification failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      data:
        error.response?.data ||
        null,
      error: error.message
    };
  }
};


const buyElectricity = async ({
  serviceID,
  billersCode,
  variationCode,
  amount,
  phone,
  requestId
}) => {
  if (!serviceID) {
    throw new Error(
      "VTpass electricity service ID is required."
    );
  }

  if (!billersCode) {
    throw new Error(
      "Electricity meter number is required."
    );
  }

  if (!variationCode) {
    throw new Error(
      "Electricity meter type is required."
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "A valid electricity amount is required."
    );
  }

  if (!phone) {
    throw new Error(
      "Customer phone number is required."
    );
  }

  const finalRequestId =
    requestId || generateRequestId();

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/pay`,
      {
        request_id:
          finalRequestId,

        serviceID,

        billersCode:
          String(billersCode),

        variation_code:
          variationCode,

        amount:
          Number(amount),

        phone:
          String(phone)
      },
      {
        headers: {
          "api-key":
            process.env.VTPASS_API_KEY,
          "secret-key":
            process.env.VTPASS_SECRET_KEY,
          "Content-Type":
            "application/json"
        },
        timeout: 30000
      }
    );

    return {
      success: true,
      requestId:
        finalRequestId,
      data:
        response.data
    };
  } catch (error) {
    console.error(
      "❌ VTpass electricity purchase failed:"
    );

    console.error(
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      requestId:
        finalRequestId,
      data:
        error.response?.data ||
        null,
      error:
        error.message
    };
  }
};

module.exports = {
  buyAirtime,
  getDataPackages,
  buyData,
  getTVPackages,
  verifyTVSmartcard,
  buyTV,
  verifyElectricityMeter,
  buyElectricity,
  requeryTransaction,
  generateRequestId
};