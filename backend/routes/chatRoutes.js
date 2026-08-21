const express = require("express");
const router = express.Router();

const ChatMessage = require("../models/ChatMessage");
const Categories = require("../models/Categories");
const User = require("../models/User");

require("dotenv").config();

// ============================================================
// GET SESSION CRITICAL CATEGORIES
// ============================================================

router.get("/session-critical-categories", async (req, res) => {

  try {

    const categoryRecord = await Categories.findOne({
      where: {
        id: 1,
      },
    });

    if (!categoryRecord) {

      return res.json({
        categories: [],
      });

    }

    return res.json({
      categories: Array.isArray(categoryRecord.categories)
        ? categoryRecord.categories
        : [],
    });

  } catch (error) {

    console.error(
      "❌ Error fetching session critical categories:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch session critical categories",
    });

  }

});


// =====================================================
// USER: GET CHAT HISTORY
// GET /api/chat/:userId
// =====================================================

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.findAll({
      where: {
        userId,
      },
      order: [["timestamp", "ASC"]],
    });

    res.status(200).json(messages);

  } catch (error) {

    console.error("Error fetching chat history:", error);

    res.status(500).json({
      error: "Error fetching messages",
    });
  }
});


// =====================================================
// USER: SEND MESSAGE
// POST /api/chat
// =====================================================

router.post("/", async (req, res) => {
  try {

    const {
      userId,
      userName,
      message,
    } = req.body;


    if (!userId || !message || !message.trim()) {

      return res.status(400).json({
        error: "User ID and message are required",
      });

    }


    const chatMessage = await ChatMessage.create({

      userId,

      userName: userName || "User",

      sender: "user",

      message: message.trim(),

      resolved: false,

      timestamp: new Date(),

    });


    res.status(201).json({
      message: "Message sent successfully",
      chatMessage,
    });


  } catch (error) {

    console.error("Error saving user message:", error);

    res.status(500).json({
      error: "Error saving message",
    });

  }
});


// =====================================================
// ADMIN: GET UNRESOLVED CONVERSATIONS
// GET /api/chat/admin/unresolved
// =====================================================

router.get("/admin/unresolved", async (req, res) => {

  try {

    const messages = await ChatMessage.findAll({

      where: {
        resolved: false,
      },

      order: [
        ["timestamp", "ASC"],
      ],

    });


    // Group messages by userId

    const conversations = {};


    messages.forEach((message) => {

      if (!conversations[message.userId]) {

        conversations[message.userId] = {

          userId: message.userId,

          userName: message.userName || "Unknown User",

          messages: [],

          lastMessage: null,

          lastMessageTime: null,

        };

      }


      conversations[message.userId].messages.push(message);


      conversations[message.userId].lastMessage =
        message.message;


      conversations[message.userId].lastMessageTime =
        message.timestamp;

    });


    res.status(200).json(
      Object.values(conversations)
    );


  } catch (error) {

    console.error(
      "Error fetching unresolved conversations:",
      error
    );

    res.status(500).json({

      error:
        "Error fetching unresolved conversations",

    });

  }

});


// =====================================================
// ADMIN: GET ONE CONVERSATION
// GET /api/chat/admin/conversation/:userId
// =====================================================

router.get(
  "/admin/conversation/:userId",
  async (req, res) => {

    try {

      const { userId } = req.params;


      const messages = await ChatMessage.findAll({

        where: {
          userId,
        },

        order: [
          ["timestamp", "ASC"],
        ],

      });


      res.status(200).json(messages);


    } catch (error) {

      console.error(
        "Error fetching conversation:",
        error
      );

      res.status(500).json({

        error:
          "Error fetching conversation",

      });

    }

  }
);


// =====================================================
// ADMIN: SEND RESPONSE
// POST /api/chat/admin/reply
// =====================================================

router.post("/admin/reply", async (req, res) => {

  try {

    const {
      userId,
      message,
    } = req.body;


    if (!userId || !message || !message.trim()) {

      return res.status(400).json({

        error:
          "User ID and message are required",

      });

    }


    // Find the user so we can keep the username
    const user = await User.findOne({

      where: {
        userId,
      },

    });


    const chatMessage = await ChatMessage.create({

      userId,

      userName:
        user?.name || "User",

      sender: "admin",

      message: message.trim(),

      resolved: false,

      timestamp: new Date(),

    });


    res.status(201).json({

      message:
        "Admin response sent successfully",

      chatMessage,

    });


  } catch (error) {

    console.error(
      "Error sending admin response:",
      error
    );

    res.status(500).json({

      error:
        "Error sending admin response",

    });

  }

});


// =====================================================
// ADMIN: RESOLVE CHAT
// PATCH /api/chat/admin/resolve/:userId
// =====================================================

router.patch(
  "/admin/resolve/:userId",
  async (req, res) => {

    try {

      const { userId } = req.params;


      await ChatMessage.update(

        {
          resolved: true,
        },

        {
          where: {
            userId,
            resolved: false,
          },
        }

      );


      res.status(200).json({

        message:
          "Chat resolved successfully",

      });


    } catch (error) {

      console.error(
        "Error resolving chat:",
        error
      );

      res.status(500).json({

        error:
          "Error resolving chat",

      });

    }

  }
);


module.exports = router;