import type { RuntimeSelectors } from "../core/types.js";
export type RuntimeElements = ReturnType<typeof getRuntimeElements>;
export declare function getRuntimeElements(selectors: RuntimeSelectors): {
    stage: HTMLElement;
    sprite: HTMLButtonElement;
    spriteImage: HTMLImageElement;
    speechBalloon: HTMLElement | null;
    speakerName: HTMLSpanElement;
    speechText: HTMLParagraphElement;
    balloonActionMenu: HTMLElement | null;
    panelActionMenu: HTMLElement | null;
    menuButtons: NodeListOf<HTMLButtonElement>;
    restoreBadge: HTMLElement | null;
    observeAreas: NodeListOf<HTMLElement>;
};
//# sourceMappingURL=domElements.d.ts.map