const mongoose = require("mongoose");

// Message 모델 스키마 정의
const messageSchema = new mongoose.Schema({
  text: String,
  time: { type: Date, default: Date.now },
  type: String,
});

// Message 모델 생성
module.exports = mongoose.model("Message", messageSchema);
