import type { RuntimeSelectors } from "../core/types.js";

export type RuntimeElements = ReturnType<typeof getRuntimeElements>;

/**
 * 런타임이 반드시 필요로 하는 DOM 요소를 찾아 반환합니다.
 */
function requiredElement<TElement extends Element>(selector: string): TElement {
  const element = document.querySelector<TElement>(selector);

  if (!element) {
    throw new Error(`Required element is missing: ${selector}`);
  }

  return element;
}

/**
 * 선택 요소가 없을 수도 있는 진단 UI를 안전하게 조회합니다.
 */
function optionalElement<TElement extends Element>(selector: string | undefined): TElement | null {
  if (!selector) {
    return null;
  }

  return document.querySelector<TElement>(selector);
}

export function getRuntimeElements(selectors: RuntimeSelectors) {
  return {
    stage: requiredElement<HTMLElement>(selectors.stage),
    sprite: requiredElement<HTMLButtonElement>(selectors.sprite),
    spriteImage: requiredElement<HTMLImageElement>(selectors.spriteImage),
    speechBalloon: optionalElement<HTMLElement>(selectors.speechBalloon),
    speakerName: requiredElement<HTMLSpanElement>(selectors.speakerName),
    speechText: requiredElement<HTMLParagraphElement>(selectors.speechText),
    balloonActionMenu: optionalElement<HTMLElement>(selectors.balloonActionMenu),
    panelActionMenu: optionalElement<HTMLElement>(selectors.panelActionMenu),
    menuButtons: document.querySelectorAll<HTMLButtonElement>(selectors.menuButtons),
    restoreBadge: optionalElement<HTMLElement>(selectors.restoreBadge),
    observeAreas: document.querySelectorAll<HTMLElement>(selectors.observeAreas),
  };
}
