/**
 * sprite 내부 클릭 좌표를 캐릭터 부위 ID로 변환합니다.
 * customHitAreas가 제공되면 이를 우선적으로 검사합니다.
 */
export function getCharacterTouchPart(clientX, clientY, rect, customHitAreas) {
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    if (customHitAreas) {
        for (const [part, area] of Object.entries(customHitAreas)) {
            if (area &&
                relativeX >= area.minX &&
                relativeX <= area.maxX &&
                relativeY >= area.minY &&
                relativeY <= area.maxY) {
                return part;
            }
        }
    }
    if (relativeY < 0.36) {
        return "head";
    }
    if (relativeY < 0.58 && relativeX > 0.22 && relativeX < 0.78) {
        return "face";
    }
    return "body";
}
//# sourceMappingURL=hitTest.js.map