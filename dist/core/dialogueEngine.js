/**
 * 캐릭터 프로필과 대사 목록을 받아 말풍선 메시지를 생성하는 엔진을 만듭니다.
 */
export function createDialogueEngine({ profile, lines }) {
    /**
     * 특정 대사 카테고리에서 랜덤 대사 하나를 고릅니다.
     */
    function pick(category) {
        const candidates = lines[category] ?? [];
        const index = Math.floor(Math.random() * candidates.length);
        return candidates[index] ?? "";
    }
    /**
     * 카테고리 기반 대사를 현재 캐릭터 화자 메시지로 변환합니다.
     */
    function line(category) {
        return {
            speaker: profile.name,
            text: pick(category),
        };
    }
    /**
     * 외부 기능이나 플러그인 결과 문장을 현재 캐릭터 화자 메시지로 감쌉니다.
     */
    function custom(text) {
        return {
            speaker: profile.name,
            text,
        };
    }
    return {
        line,
        custom,
    };
}
//# sourceMappingURL=dialogueEngine.js.map