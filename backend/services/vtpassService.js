const axios = require("axios");

const VTPASS_BASE_URL = "https://sandbox.vtpass.com/api";

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

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 12);

  return `${timestamp}${randomPart}`;
};

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
    throw new Error("A valid airtime amount is required.");
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
    console.error("❌ VTpass airtime request failed:");

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

const requeryTransaction = async (requestId) => {
  if (!requestId) {
    throw new Error("VTpass request ID is required.");
  }

  try {
    const response = await axios.post(
      `${VTPASS_BASE_URL}/requery`,
      {
        request_id: requestId
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
      requestId,
      data: response.data
    };
  } catch (error) {
    console.error("❌ VTpass transaction requery failed:");

    console.error(
      error.response?.data || error.message
    );

    return {
      success: false,
      requestId,
      data: error.response?.data || null,
      error: error.message
    };
  }
};

module.exports = {
  buyAirtime,
  requeryTransaction,
  generateRequestId
};