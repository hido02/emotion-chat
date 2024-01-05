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

  const searchPlaces = async (location, radius, type, newUserMessage) => {
    try {
      const response = await fetch("http://localhost:3001/api/search-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location, radius, type, newUserMessage }),
      });

      if (!response.ok) {
        throw new Error("장소 검색에 실패했습니다.");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("장소 검색 오류:", error);
      return null;
    }
  };

  const getWeather = async (cityName, newUserMessage) => {
    try {
      const response = await fetch("http://localhost:3001/api/get-weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cityName, newUserMessage }),
      });
      if (!response.ok) {
        throw new Error("날씨 정보를 가져오는데 실패했습니다.");
      }

      const weatherData = await response.json();
      console.log("여기서 weatherData", weatherData);
      return weatherData;
    } catch (error) {
      console.error("날씨 정보 가져오기 오류:", error);
      return null;
    }
  };

  // 이전 대화 기록을 가져오기 위한 함수
  const fetchPreviousMessages = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/chat-history");
      if (!response.ok) {
        throw new Error("이전 대화 기록을 불러오는데 실패했습니다.");
      }
      const data = await response.json();

      const renderMessageText = (text) => {
        // HTML 태그를 그대로 렌더링하기 위해 dangerouslySetInnerHTML 사용
        return <div dangerouslySetInnerHTML={{ __html: text }} />;
      };
      const renderMessages = data.messages.map((message) => ({
        text: renderMessageText(message.text),
        type: message.type,
        time: new Date(message.time),
      }));
      setMessages(renderMessages);
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

  const typeMapping = {
    공원: "park",
    카페: "cafe",
    // 기타 장소 유형에 대한 매핑
  };

  const handleSendMessage = async (message) => {
    const newUserMessage = {
      text: message,
      type: "user",
      time: new Date(),
    };
    addMessage(newUserMessage);

    function sendBotMessage(message) {
      const botResponseMessage = {
        text: message,
        type: "bot",
        time: new Date(),
      };
      addMessage(botResponseMessage);
    }

    function getWeatherIcon(description) {
      console.log("날씨 상태:", description);
      const weatherConditions = {
        "clear sky": "☀️",
        "few clouds": "🌤️",
        "scattered clouds": "☁️",
        "broken clouds": "☁️",
        "shower rain": "🌧️",
        rain: "🌦️",
        thunderstorm: "⛈️",
        snow: "❄️",
        haze: "🌫️",

        // 기타 날씨 상태와 이모티콘을 추가할 수 있습니다.
      };

      return weatherConditions[description.toLowerCase()] || "🌈";
    }

    const renderMessageText = (text) => {
      const htmlText = text.split("\n").map((line, index) => {
        // URL 형식을 감지하여 JSX 링크로 변환
        if (line.includes('href="')) {
          const parts = line
            .split(/(<a href=".+?">.+?<\/a>)/)
            .filter((part) => part);
          return (
            <React.Fragment key={index}>
              {parts.map((part, partIndex) => {
                if (part.startsWith('<a href="')) {
                  const urlMatch = part.match(/href="(.+?)"/);
                  const textMatch = part.match(/">(.+?)<\/a>/);
                  return urlMatch && textMatch ? (
                    <a
                      key={partIndex}
                      href={urlMatch[1]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {textMatch[1]}
                    </a>
                  ) : (
                    part
                  );
                }
                return part;
              })}
              <br />
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        );
      });
      return <div>{htmlText}</div>;
    };

    if (message.includes("날씨")) {
      const cityPattern = /(.+) 날씨 알려줘/; // "날씨 정보" 다음에 도시 이름이 오는 패턴
      const matches = message.match(cityPattern);

      if (matches && matches[1]) {
        const cityName = matches[1];
        const weatherData = await getWeather(cityName, newUserMessage);

        console.log("weatherData", weatherData);

        if (weatherData) {
          const temperature = weatherData.main.temp;
          const description = weatherData.weather[0].description;
          const weatherIcon = getWeatherIcon(description);
          const responseMessageLines = [
            `🌆 현재 ${cityName}의 날씨 정보:`,
            `🌡️ 기온: ${temperature}°C`,
            `🌬️ 날씨 상태: ${weatherIcon} ${description}`,
          ];

          // 문자열 배열을 JSX 요소로 변환
          const renderedText = (
            <div>
              {responseMessageLines.map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          );

          // JSX 요소를 메시지 목록에 추가
          const renderedTextMessage = {
            text: renderedText,
            type: "bot",
            time: new Date(),
          };

          addMessage(renderedTextMessage);
        } else {
          // 날씨 정보를 가져오지 못한 경우 오류 메시지 전송
          sendBotMessage("날씨 정보를 가져오는데 문제가 발생했습니다.");
        }
      }
    }

    if (!message.includes("추천해줘") && !message.includes("날씨")) {
      // "추천해줘"가 포함되지 않은 경우에만 API 호출
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
    } else {
      console.log("여기까지");
      const pattern = /(.+)에서 (.+)미터 내의 (.+) 추천해줘/;
      const matches = message.match(pattern);
      let location, locationName, radius, type, typeName;

      if (matches) {
        locationName = matches[1]; // 첫 번째 ~
        radius = matches[2]; // 두 번째 ~
        typeName = matches[3]; // 세 번째 ~

        console.log(locationName, radius, typeName);

        location = await geocodeLocation(locationName);

        type = typeMapping[typeName] || typeName;
      } else {
        // matches가 없는 경우, 기본값이나 오류 처리
        return;
      }

      console.log(location, radius, type);

      const createPhotoUrl = (photoReference) => {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=AIzaSyCpST1G2yZzKFs6m-j2QAfXy2uoinbjf-8`;
      };

      console.log(newUserMessage);

      const placesData = await searchPlaces(
        location,
        radius,
        type,
        newUserMessage
      );
      if (placesData && placesData.results.length > 0) {
        const places = placesData.results
          .map((place) => {
            const photoUrl =
              place.photos && place.photos.length > 0
                ? createPhotoUrl(place.photos[0].photo_reference)
                : null;
            return `📍 장소명: ${place.name}\n⭐ 평점: ${
              place.rating || "평점 정보 없음"
            }\n🏠 주소: ${place.vicinity}${
              photoUrl
                ? `\n📷 사진: <a href="${photoUrl}" target="_blank">보기</a>`
                : ""
            }`;
          })
          .join("\n\n");

        const responseMessage = {
          text: `주변의 추천 장소들입니다:\n${places}`,
          type: "bot",
          time: new Date(),
        };

        const renderedText = renderMessageText(responseMessage.text);

        const renderedTextMessage = {
          text: renderedText,
          type: "bot",
          time: new Date(),
        };

        addMessage(renderedTextMessage);
      } else {
        const responseMessage = {
          text: "검색된 장소가 없습니다.",
          type: "bot",
          time: new Date(),
        };

        addMessage(responseMessage);
      }
    }

    setInputText("");
  };

  async function geocodeLocation(locationName) {
    const apiKey = "AIzaSyCpST1G2yZzKFs6m-j2QAfXy2uoinbjf-8"; // Google Maps API 키
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      locationName
    )}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        // 첫 번째 결과의 좌표를 반환
        const location = data.results[0].geometry.location;
        const lat = location.lat.toFixed(4); // 위도 소수점 네 자리
        const lng = location.lng.toFixed(4); // 경도 소수점 네 자리
        return `${lat},${lng}`;
      } else {
        throw new Error(data.status);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

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
