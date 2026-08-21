require("dotenv").config();
const { Server } = require("socket.io");
const OpenAI = require("openai");
const sanitizeHtml = require("sanitize-html");
const validator = require("validator");

const KnowledgeBase = require("../models/KnowledgeBase"); // Sequelize model
const ChatMessage = require("../models/ChatMessage");     // Sequelize model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = (server) => {
  console.log("🚀 Initializing WebSocket Server...");

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("message", async (data) => {
      try {
        console.log("📩 Received raw message:", data);

        // Parse and destructure message
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        let { userId, text } = parsedData;

        console.log(`📩 User ${userId} sent: ${text}`);

        // Sanitize and validate message
        text = sanitizeHtml(text, {
          allowedTags: [],
          allowedAttributes: {},
        });
        text = validator.trim(text);
        text = validator.escape(text);

        if (!validator.isLength(text, { min: 1, max: 1000 })) {
          console.log("🚨 Invalid message detected, ignoring...");
          return;
        }

        // Store user message
        await ChatMessage.create({ userId, sender: "user", message: text });

        // Fetch knowledge base
        const knowledgeEntries = await KnowledgeBase.findAll();
        const knowledgeText = knowledgeEntries
          .map((entry) => `Title: ${entry.title}\n${entry.content}`)
          .join("\n\n");

        // Generate AI response using OpenAI
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a support assistant for an investment platform." },
            { role: "user", content: `Platform info:\n\n${knowledgeText}\n\nUser: ${text}` },
          ],
          max_tokens: 500,
        });

        const responseText = aiResponse.choices[0].message.content;

        // Store AI response
        await ChatMessage.create({ userId, sender: "ai", message: responseText });

        // Send response back to the client
        socket.emit("message", { text: responseText, sender: "ai" });

      } catch (error) {
        console.error("🚨 WebSocket Error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  console.log("✅ WebSocket Server Initialized");
  return io;
};
