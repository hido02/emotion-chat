const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dialogflow = require("dialogflow");
const projectId = "test-chat-bot-app-394503";
const credentials = require("./test-chat-bot-app-394503-ed0b55fa1a67.json");
require("dotenv").config();

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const sessionClient = new dialogflow.SessionsClient({
  projectId: projectId,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const app = express();
const port = 3001; // 포트 번호를 원하는 대로 설정하세요.

app.use(bodyParser.json());
app.use(cors());

// 사용자 입력 메시지를 Dialogflow로 보내고 응답을 받아옴
async function sendMessageToDialogflow(userMessage) {
  const sessionPath = sessionClient.sessionPath(projectId, "unique-session-id");
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: userMessage,
        languageCode: "en-US", // 사용하는 언어 코드
      },
    },
  };

  const [response] = await sessionClient.detectIntent(request);
  return response.queryResult.fulfillmentText; // Dialogflow에서 받은 응답
}

// /api/chat 엔드포인트
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message; // 클라이언트에서 보낸 사용자 메시지
  // 여기에서 챗봇 응답을 처리하고, 챗봇 응답을 생성합니다.
  const botResponse = await sendMessageToDialogflow(userMessage);

  // 클라이언트로 응답을 보냅니다.
  res.json({ botResponse });
});

app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});
