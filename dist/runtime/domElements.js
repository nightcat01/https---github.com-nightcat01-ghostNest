/**
 * 런타임이 반드시 필요로 하는 DOM 요소를 찾아 반환합니다.
 */
function requiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Required element is missing: ${selector}`);
    }
    return element;
}
/**
 * 선택 요소가 없을 수도 있는 진단 UI를 안전하게 조회합니다.
 */
function optionalElement(selector) {
    if (!selector) {
        return null;
    }
    return document.querySelector(selector);
}
export function getRuntimeElements(selectors) {
    return {
        stage: requiredElement(selectors.stage),
        sprite: requiredElement(selectors.sprite),
        spriteImage: requiredElement(selectors.spriteImage),
        speechBalloon: optionalElement(selectors.speechBalloon),
        speakerName: requiredElement(selectors.speakerName),
        speechText: requiredElement(selectors.speechText),
        balloonActionMenu: optionalElement(selectors.balloonActionMenu),
        panelActionMenu: optionalElement(selectors.panelActionMenu),
        menuButtons: document.querySelectorAll(selectors.menuButtons),
        restoreBadge: optionalElement(selectors.restoreBadge),
        observeAreas: document.querySelectorAll(selectors.observeAreas),
    };
}
//# sourceMappingURL=domElements.js.map