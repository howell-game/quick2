const { Sequelize } = require("sequelize");

require("dotenv").config();

// ==========================================================
// DATABASE CONNECTION
// ==========================================================

// Set DB_SSL=true when connecting externally.
// Set DB_SSL=false when connecting internally.
//
// Example:
//
// Local computer → Render PostgreSQL:
// DB_SSL=true
//
// Render backend → Render PostgreSQL internal network:
// DB_SSL=false

const useSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(

    process.env.DB_NAME,

    process.env.DB_USER,

    process.env.DB_PASSWORD,

    {

        host: process.env.DB_HOST,

        port: process.env.DB_PORT,

        dialect: "postgres",

        logging: false,

        // ==================================================
        // SSL CONFIGURATION
        // ==================================================

        ...(useSSL && {

            dialectOptions: {

                ssl: {

                    require: true,

                    rejectUnauthorized: false

                }

            }

        })

    }

);

sequelize.authenticate()

.then(() => {

    console.log("✅ PostgreSQL connected successfully.");

    console.log(
        `🔐 PostgreSQL SSL: ${useSSL ? "ENABLED" : "DISABLED"}`
    );

})

.catch((err) => {

    console.error(
        "❌ PostgreSQL connection failed:",
        err
    );

});

module.exports = sequelize;