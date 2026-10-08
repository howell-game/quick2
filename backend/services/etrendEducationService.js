const axios = require("axios");

const VTPASS_BASE_URL =
  process.env.VTPASS_BASE_URL ||
  "https://sandbox.vtpass.com/api";

const generateRequestId = () => {
  const now = new Date();

  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 10);

  return `${datePart}-${randomPart}`;
};


/*
==========================================================
GET EDUCATION PACKAGES
==========================================================
*/

const getEducationPackages = async (
  serviceID
) => {

  const response =
    await axios.get(
      `${VTPASS_BASE_URL}/service-variations`,
      {
        params: {
          serviceID,
        },

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          apiKey:
            process.env.VTPASS_API_KEY,

          secretKey:
            process.env.VTPASS_SECRET_KEY,

        },
      }
    );

  return response.data;
};


/*
==========================================================
VERIFY JAMB PROFILE ID
==========================================================
*/

const verifyJAMBProfile = async ({
  profileId,
  variationCode,
}) => {

  const response =
    await axios.post(
      `${VTPASS_BASE_URL}/merchant-verify`,
      {
        billersCode:
          String(profileId),

        serviceID:
          "jamb",

        type:
          variationCode,
      },
      {
        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          apiKey:
            process.env.VTPASS_API_KEY,

          secretKey:
            process.env.VTPASS_SECRET_KEY,
        },
      }
    );

  return response.data;
};


/*
==========================================================
BUY EDUCATION PIN
==========================================================
*/

const buyEducationPIN = async ({
  serviceID,
  variationCode,
  amount,
  phone,
  profileId,
  quantity = 1,
}) => {

  const requestId =
    generateRequestId();

  const payload = {
    request_id:
      requestId,

    serviceID:
      serviceID,

    variation_code:
      variationCode,

    amount:
      Number(amount),

    quantity:
      Number(quantity),

    phone:
      String(phone),
  };


  /*
   * JAMB requires the Profile ID.
   */

  if (
    serviceID === "jamb"
  ) {
    payload.billersCode =
      String(profileId);
  }


  const response =
    await axios.post(
      `${VTPASS_BASE_URL}/pay`,
      payload,
      {
        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          apiKey:
            process.env.VTPASS_API_KEY,

          secretKey:
            process.env.VTPASS_SECRET_KEY,
        },
      }
    );


  return {
    requestId,
    data: response.data,
  };
};


/*
==========================================================
REQUERY EDUCATION TRANSACTION
==========================================================
*/

const requeryEducationPIN =
  async (requestId) => {

    const response =
      await axios.post(
        `${VTPASS_BASE_URL}/requery`,
        {
          request_id:
            requestId,
        },
        {
          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            apiKey:
              process.env.VTPASS_API_KEY,

            secretKey:
              process.env.VTPASS_SECRET_KEY,
          },
        }
      );

    return response.data;
  };


module.exports = {
  getEducationPackages,
  verifyJAMBProfile,
  buyEducationPIN,
  requeryEducationPIN,
};