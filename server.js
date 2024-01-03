const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Dialogflow 설정 (이 부분은 필요에 따라 유지하거나 수정)
const dialogflow = require("dialogflow");
const projectId = "test-chat-bot-app-394503";
const sessionClient = new dialogflow.SessionsClient({
  projectId: projectId,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// MongoDB 연결
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/chatLogs";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err));

// Express 애플리케이션 초기화
const app = express();
const port = 3001; // 포트 번호를 원하는 대로 설정하세요.

// 미들웨어 사용
app.use(bodyParser.json());
app.use(cors());

// 새로운 라우터 가져오기
const chatRoutes = require("./src/routes/chatRoutes");

// 라우터를 Express 애플리케이션에 사용
app.use(chatRoutes);

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
});
