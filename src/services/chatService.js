const Message = require("../models/messageModel");

const dialogflow = require("dialogflow"); // Dialogflow 클라이언트
const projectId = "test-chat-bot-app-394503"; // Dialogflow 프로젝트 ID

// MongoDB에 메시지 저장
async function saveMessage(userMessage) {
  const text = userMessage.text || "";
  const time = userMessage.time || new Date();
  const type = userMessage.type || "user";

  const message = new Message({ text, time, type });
  try {
    await message.save();
  } catch (error) {
    console.error("메시지 저장 실패:", error);
    throw error;
  }
}

// Dialogflow 세션 클라이언트 인스턴스 생성
const sessionClient = new dialogflow.SessionsClient();

async function sendMessageToDialogflow(userMessage) {
  // userMessage 객체가 존재하고, text 속성도 존재하는지 확인
  if (!userMessage) {
    console.error("유효하지 않은 메시지입니다.");
    throw new Error("유효하지 않은 메시지입니다.");
  }

  // Dialogflow 세션 경로 생성
  const sessionPath = sessionClient.sessionPath(projectId, "unique-session-id");

  // Dialogflow로 보낼 요청 객체 생성
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userMessage,
        languageCode: "en-US",
      },
    },
  };

  try {
    // Dialogflow에 요청을 보내고 응답을 받음
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    // Dialogflow 응답 텍스트 반환
    return result.fulfillmentText;
  } catch (error) {
    console.error("Dialogflow API 요청 중 오류 발생:", error);
    throw error;
  }
}

module.exports = { saveMessage, sendMessageToDialogflow };
