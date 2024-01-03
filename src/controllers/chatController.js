const chatService = require("../services/chatService");
const Message = require("../models/messageModel");

async function postChat(req, res) {
  try {
    const userMessage = req.body;
    if (!userMessage) {
      console.error("요청에 메시지가 없습니다.");
      return res.status(400).send("메시지가 필요합니다.");
    }

    // Dialogflow에 사용자 메시지를 보내고 응답을 받음
    const botResponse = await chatService.sendMessageToDialogflow(
      userMessage.message
    );

    // 사용자 메시지 저장
    await chatService.saveMessage({
      text: userMessage.message,
      time: new Date(),
      type: "user",
    });

    // botResponse 저장
    await chatService.saveMessage({
      text: botResponse,
      time: new Date(),
      type: "bot",
    });

    res.json({ botResponse });
  } catch (error) {
    console.error("에러 발생:", error);
    res.status(500).send("서버 에러 발생");
  }
}

// 대화 기록 가져오기
async function getChatHistory(req, res) {
  try {
    // MongoDB에서 모든 대화 기록을 가져옵니다.
    const messages = await Message.find().sort({ time: 1 });
    // 대화 기록을 JSON 형태로 응답합니다.
    res.json({ messages });
  } catch (error) {
    console.error("대화 기록 가져오기 오류:", error);
    res.status(500).send("대화 기록을 가져오는 도중 오류가 발생했습니다.");
  }
}

module.exports = { postChat, getChatHistory };
