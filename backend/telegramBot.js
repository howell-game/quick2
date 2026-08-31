const { Bot } = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
console.error("❌ TELEGRAM_BOT_TOKEN is missing.");
process.exit(1);
}

// ======================================================
// CREATE BOT
// ======================================================

const bot = new Bot(token);

console.log("🤖 TrendGame9ja Telegram bot created.");

// ======================================================
// ALL MESSAGES
// ======================================================

bot.on("message", async (ctx) => {


const text = ctx.message?.text;

console.log("📩 MESSAGE RECEIVED:", text);

// ==================================================
// /start
// ==================================================

if (text === "/start") {

    console.log("🚀 /start received.");

    try {

        await ctx.reply(
            `👋 Hello ${ctx.from?.first_name || "Naija"}!


🎮 Welcome to TrendGame9ja!

TrendGame is a gaming platform where you try to decode the next trend across different categories.

🔥 Music
🌾 Agriculture
🪵 Woodwork
🎬 Media
📚 And more!

You can also try DEMO MODE before using real funds.

👇 Choose an option below:`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "🎮 Play TrendGame",
url: "https://trendgame.vercel.app"
}
],
[
{
text: "ℹ️ How It Works",
callback_data: "how_it_works"
}
],
[
{
text: "🎯 Demo Mode",
callback_data: "demo"
}
]
]
}
}
);

        console.log("✅ /start reply sent.");

    } catch (error) {

        console.error("❌ /start reply error:", error);

    }

}

});

// ======================================================
// CALLBACK BUTTONS
// ======================================================

bot.on("callback_query", async (ctx) => {

const query = ctx.callbackQuery;

console.log(
    "🔘 BUTTON PRESSED:",
    query?.data
);

if (!query) {
    return;
}


// ==================================================
// HOW IT WORKS
// ==================================================

if (query.data === "how_it_works") {

    try {

        await ctx.answerCallbackQuery();

        await ctx.reply(
            `🎮 HOW TRENDGAME WORKS

1️⃣ Choose a category.

2️⃣ Study the available trends.

3️⃣ Try to decode what happens next.

4️⃣ You can practice with DEMO MODE.

5️⃣ When you're ready, you can use REAL MODE with your own disposable funds.

6️⃣ Successful real-game rewards can be withdrawn according to the platform rules.

⚠️ Play responsibly. Only use funds you can afford to lose.`
);

    } catch (error) {

        console.error(
            "❌ How It Works error:",
            error
        );

    }

}


// ==================================================
// DEMO MODE
// ==================================================

if (query.data === "demo") {

    try {

        await ctx.answerCallbackQuery();

        await ctx.reply(
            `🎯 DEMO MODE

Not ready to use real funds?

No problem.

Practice first, learn the game and develop your own approach.

👇 Open TrendGame9ja:`,
{
reply_markup: {
inline_keyboard: [
[
{
text: "🎮 Open TrendGame9ja",
url: "https://trendgame.vercel.app"
}
]
]
}
}
);
    } catch (error) {

        console.error(
            "❌ Demo Mode error:",
            error
        );

    }

}
});

// ======================================================
// ERROR HANDLER
// ======================================================

bot.catch((error) => {


console.error(
    "❌ Telegram Bot Error:",
    error
);

});

// ======================================================
// START POLLING
// ======================================================

(async () => {

try {

    console.log("🔄 Starting Telegram polling...");

    await bot.startPolling();

} catch (error) {

    console.error(
        "❌ Telegram polling error:",
        error
    );

}

})();
