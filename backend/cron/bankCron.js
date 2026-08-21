const cron = require("node-cron");

const Bank = require("../models/Bank");

const {
    getBanks,
} = require("../services/flutterwaveService");



cron.schedule('0 0 * * *', async () => {

    try {

        console.log("Updating bank list...");

        const result = await getBanks();

console.log(JSON.stringify(result.data, null, 2));

        if (!result.data)
            return;

        await Bank.destroy({
            where: {},
            truncate: true,
        });

        const banks = result.data
    .filter(bank => bank.code && bank.name)
    .map(bank => ({
        code: String(bank.code),
        name: String(bank.name),
        slug: bank.slug || null,
        country: bank.country || "NG",
        active: true,
    }));

        const uniqueBanks = [
    ...new Map(
        banks.map(bank => [bank.code, bank])
    ).values()
];

await Bank.bulkCreate(uniqueBanks, {
    updateOnDuplicate: ["name", "slug", "country", "active"]
});

        console.log("Banks Updated:", banks.length);

    }
    catch (err) {

    console.error(err);

    if (err.errors) {
        console.log(err.errors);
    }

}

});