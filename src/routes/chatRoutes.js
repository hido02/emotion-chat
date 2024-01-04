const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { Message } = require("../models/messageModel");

router.post("/api/chat", chatController.postChat);

router.get("/api/chat-history", chatController.getChatHistory);

router.post("/api/search-places", chatController.searchPlaces);

module.exports = router;
