const fortunes = [
    {
        title: "잔잔한 길운",
        message: "오늘은 크게 밀어붙이기보다 작은 정리를 끝내기 좋은 날이야.",
        expression: "thinking",
    },
    {
        title: "새싹 운",
        message: "작게 시작한 일이 생각보다 오래 갈 수 있어. 첫 단추를 가볍게 끼워보자.",
        expression: "happy",
    },
    {
        title: "주의 운",
        message: "결정은 조금 천천히. 특히 새 의존성이나 큰 구조 변경은 한 번 더 확인하는 게 좋아.",
        expression: "surprised",
    },
    {
        title: "집중 운",
        message: "오늘은 한 화면, 한 기능만 끝까지 잡으면 성과가 선명하게 남을 거야.",
        expression: "thinking",
    },
];
export const fortunePlugin = {
    id: "fortune",
    name: "오늘 운세",
    description: "오늘의 운세를 뽑아 캐릭터 말풍선으로 해석합니다.",
    /**
     * 더미 운세 목록에서 오늘의 운세 결과 하나를 반환합니다.
     */
    execute() {
        const index = Math.floor(Math.random() * fortunes.length);
        return fortunes[index] ?? fortunes[0];
    },
};
/**
 * 기존 호출부와의 호환을 위한 운세 실행 헬퍼입니다.
 */
export function drawFortune() {
    return fortunePlugin.execute();
}
//# sourceMappingURL=index.js.map