import React, { useState, useRef, useEffect } from "react";
import "./ChatApp.css";

function ChatApp(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const messageListRef = useRef(null);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message) => {
    const newUserMessage = { text: message, type: "user", time: new Date() };
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
              {message.text}
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
