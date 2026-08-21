const axios = require("axios");

const headers = {
    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    "Content-Type": "application/json",
};

async function createPayment(data) {

    const response = await axios.post(

        "https://api.flutterwave.com/v3/payments",

        data,

        { headers }

    );

    return response.data;
}

async function getBanks() {

    const response = await axios.get(

        "https://api.flutterwave.com/v3/banks/NG",

        { headers }

    );

    return response.data;
}

async function resolveAccount(account_number, account_bank) {
    const payload = {
        account_number,
        account_bank: account_bank, // convert to number
    };

    console.log("URL:", process.env.FLW_LOOKUP_URL);
    console.log("Headers:", headers);
    console.log("Payload:", payload);

    const response = await axios.post(
        process.env.FLW_LOOKUP_URL,
        payload,
        { headers }
    );

    return response.data;
}

async function transfer(data) {

    const response = await axios.post(

        process.env.FLW_URL,

        data,

        { headers }

    );

    return response.data;
}

module.exports = {
    createPayment,
    getBanks,
    resolveAccount,
    transfer,
};