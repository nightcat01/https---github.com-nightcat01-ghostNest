/**
 * 캐릭터 런타임이 사용하는 초기 상태 객체를 생성합니다.
 */
export function createRuntimeState() {
    return {
        isHidden: false,
        lastInteractionAt: Date.now(),
        expression: "neutral",
        lastTouchedPart: null,
        lastPromptedAt: 0,
        mode: "idle",
        data: {},
    };
}
//# sourceMappingURL=runtimeState.js.map