const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { Message } = require("../models/messageModel");

router.post("/api/chat", chatController.postChat);

router.get("/api/chat-history", chatController.getChatHistory);

module.exports = router;
