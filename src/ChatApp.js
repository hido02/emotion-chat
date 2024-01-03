import React, { useState, useRef, useEffect } from "react";
import "./ChatApp.css";

// 사용자 및 봇 이미지의 경로를 정확하게 지정해주세요.
const userImage = "/userimage.jpg";
const botImage = "/botimage.png";

function ChatApp(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const messageListRef = useRef(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // 이전 대화 기록을 가져오기 위한 함수
  const fetchPreviousMessages = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/chat-history");
      if (!response.ok) {
        throw new Error("이전 대화 기록을 불러오는데 실패했습니다.");
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("이전 대화 기록을 가져오는데 오류 발생:", error);
    }
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 이전 대화 기록을 가져옴
    fetchPreviousMessages();

    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);

  const handleSendMessage = async (message) => {
    const newUserMessage = {
      text: message,
      type: "user",
      time: new Date(),
    };
    addMessage(newUserMessage);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("서버 응답이 실패했습니다.");
      }

      const data = await response.json();
      const botResponseMessage = {
        text: data.botResponse,
        type: "bot",
        time: new Date(),
      };
      addMessage(botResponseMessage);
    } catch (error) {
      console.error("오류 발생:", error);
    }

    setInputText("");
  };

  const addMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (inputText) {
      handleSendMessage(inputText);
    }
  };

  const sortedMessages = messages.slice().sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return timeA - timeB;
  });

  const reversedMessages = [...sortedMessages].reverse();

  return (
    <div className="chat-app">
      <div className="chat-window">
        <div className="message-list" ref={messageListRef}>
          {reversedMessages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.type === "user" ? (
                <div className="user-message">
                  <img src={userImage} alt="User" className="user-image" />
                  <div className="message-text">{message.text}</div>
                </div>
              ) : (
                <div className="bot-message">
                  <img src={botImage} alt="Bot" className="bot-image" />
                  <div className="message-text">{message.text}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="input-box">
          <input
            type="text"
            placeholder="메시지 입력..."
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage}>전송</button>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;
