const express = require("express");
const path = require('path');
const cors = require("cors");
require("dotenv").config();
require("./telegramBot");
require("./cron/bankCron");
const cron = require("node-cron");
const http = require("http");  // ✅ Required for WebSocket
const bodyParser = require("body-parser");

// Import Sequelize setup
const sequelize = require("./db");  // Import your Sequelize instance

const { startAllCycles } = require("./utils/timeframeCycles");
const Admin = require("./models/Admin");
const createInitialAdmin = require("./utils/createAdmin");
const transactionRoutes = require("./routes/transactionRoutes");
const authRoutes = require("./routes/authRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const outcomeRoutes = require("./routes/outcomeRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);  // ✅ Create HTTP server

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "https://quickstock9ja.site",  
    "https://trendgame.vercel.app",                 // ✅ add this // ✅ Correct frontend URL// CORS updated: 2025-04-17
     'https://quickstock9ja.onrender.com',
     "https://howell-game.github.io",
    "http://localhost:5173",  // ✅ Allow Vue.js development frontend
    "http://localhost:3000"   // ✅ Allow local testing with serve -s dist
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

// 🔁 Redirect root domain to www
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host === "quickstock9ja.site") {
    return res.redirect(301, `https://www.quickstock9ja.site${req.originalUrl}`);
  }
  next();
});


app.use(bodyParser.json());

// ✅ Setup WebSocket properly
const chatSocket = require("./websocket/chatSocket");
chatSocket(server);  // Initialize WebSocket Server with the Express HTTP server

// Routes
app.use("/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/outcomes", outcomeRoutes);
app.use("/api/users", balanceRoutes);

app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/investments", investmentRoutes);
// Serve static files from Vue.js build
app.use(express.static(path.join(__dirname, 'dist'))); // Update this path to where your build folder is located

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// Sequelize Connection
// Sequelize Connection
// Sequelize Connection
sequelize
  .sync({ alter: true })
  .then(async () => {

    console.log("✅ Database synced successfully!");

    startAllCycles();

    await createInitialAdmin();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.log("Error syncing database", err);
  });