export const weatherPlugin = {
    id: "weather",
    name: "현재 날씨 확인",
    execute: async () => {
        try {
            // 서울 기준 좌표 (테스트용)
            const lat = 37.5665;
            const lon = 126.9780;
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            if (!response.ok) {
                throw new Error("날씨 정보를 가져올 수 없습니다.");
            }
            const data = await response.json();
            const temp = data.current_weather.temperature;
            const windSpeed = data.current_weather.windspeed;
            let message = `지금 서울의 기온은 ${temp}°C, 풍속은 ${windSpeed}km/h 예요.`;
            let expression = "neutral";
            if (temp < 10) {
                message += " 날이 쌀쌀하니 따뜻하게 입으세요!";
                expression = "surprised";
            }
            else if (temp > 28) {
                message += " 날이 무척 덥네요. 더위 조심하세요!";
                expression = "surprised";
            }
            else {
                message += " 활동하기 좋은 날씨네요.";
                expression = "happy";
            }
            return {
                title: "날씨 정보",
                message,
                expression
            };
        }
        catch (e) {
            return {
                title: "날씨 정보 오류",
                message: "날씨 정보를 불러오는 데 실패했어요. 인터넷 연결을 확인해주세요.",
                expression: "thinking"
            };
        }
    },
};
//# sourceMappingURL=index.js.map