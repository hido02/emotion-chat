const chatService = require("../services/chatService");
const Message = require("../models/messageModel");
const axios = require("axios");

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

    // 각 메시지의 텍스트에서 줄바꿈 문자를 <br> 태그로 변환합니다.
    const formattedMessages = messages.map((message) => {
      message.text = message.text.replace(/\n/g, "<br>");
      return message;
    });

    // 대화 기록을 JSON 형태로 응답합니다.
    res.json({ messages: formattedMessages });
  } catch (error) {
    console.error("대화 기록 가져오기 오류:", error);
    res.status(500).send("대화 기록을 가져오는 도중 오류가 발생했습니다.");
  }
}

async function searchPlaces(req, res) {
  const { location, radius, type, newUserMessage } = req.body;

  console.log(req.body);

  try {
    // 사용자의 검색 요청 메시지 저장
    const searchRequestMessage = newUserMessage.text;
    await chatService.saveMessage({
      text: searchRequestMessage,
      time: new Date(),
      type: "user",
    });

    const apiKey = "AIzaSyCpST1G2yZzKFs6m-j2QAfXy2uoinbjf-8"; // Google Places API 키
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    const response = await axios.get(url);

    const createPhotoUrl = (photoReference) => {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${apiKey}`;
    };

    const searchResultText = response.data.results
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
      .join("\n");

    await chatService.saveMessage({
      text: `주변의 추천 장소들입니다:\n${searchResultText}`,
      time: new Date(),
      type: "bot",
    });

    res.json(response.data);
  } catch (error) {
    console.error("장소 검색 오류:", error);
    res.status(500).json({ error: error.message });
  }
}

const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate({
  key: "AIzaSyCpST1G2yZzKFs6m-j2QAfXy2uoinbjf-8",
}); // 여기에 실제 API 키를 입력하세요

async function translateCityName(cityName) {
  try {
    let [translation] = await translate.translate(cityName, "en");
    return translation;
  } catch (error) {
    console.error("도시 이름 번역 오류:", error);
    return null;
  }
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

async function getWeatherInfo(req, res) {
  const { cityName, newUserMessage } = req.body;
  const requestMessage = newUserMessage.text;
  await chatService.saveMessage({
    text: requestMessage,
    time: new Date(),
    type: "user",
  });
  const translatedCityName = await translateCityName(cityName);
  console.log("번역된 도시 이름", translatedCityName);
  const apiKey = "5d7bc6e85baff77927d8958def996fff"; // OpenWeatherMap에서 발급한 API 키

  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${translatedCityName}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    // 날씨 정보를 형식화된 문자열로 변환
    const temperature = weatherData.main.temp;
    const description = weatherData.weather[0].description;
    const weatherIcon = getWeatherIcon(description);
    const responseMessage = `🌆 현재 ${cityName}의 날씨 정보:\n
      🌡️ 기온: ${temperature}°C\n
      🌬️ 날씨 상태: ${weatherIcon} ${description}`;

    // 데이터베이스에 날씨 정보 저장
    await chatService.saveMessage({
      text: responseMessage,
      time: new Date(),
      type: "bot",
    });

    // 클라이언트에게 응답 반환
    res.json(weatherData);
  } catch (error) {
    console.error("날씨 정보 가져오기 오류:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { postChat, getChatHistory, searchPlaces, getWeatherInfo };
