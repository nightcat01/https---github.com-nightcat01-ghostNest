import { rine } from "./characters/rine/index.js";
import { fortunePlugin } from "./plugins/fortune/index.js";
import { createGhostRuntime } from "./runtime/createGhostRuntime.js";
const ghostNestWindow = window;
ghostNestWindow.__ghostNestRuntime__?.destroy();
ghostNestWindow.__ghostNestRuntime__ = createGhostRuntime({
    character: rine,
    plugins: [fortunePlugin],
    selectors: {
        stage: "#characterStage",
        sprite: "#characterSprite",
        spriteImage: "#characterSpriteImage",
        speakerName: "#speakerName",
        speechText: "#speechText",
        balloonActionMenu: "#balloonActionMenu",
        eventLog: "#eventLog",
        menuButtons: "[data-command]",
        observeAreas: "[data-observe-area]",
        statusMode: "#statusMode",
        statusExpression: "#statusExpression",
        statusVisibility: "#statusVisibility",
        statusLastEvent: "#statusLastEvent",
        statusIdleCountdown: "#statusIdleCountdown",
        statusRandomPrompt: "#statusRandomPrompt",
        statusActionTimers: "#statusActionTimers",
    },
    features: {
        commandHoverDescription: true,
    },
    typing: {
        enabled: true,
        interval: 26,
    },
    spriteSize: {
        desktopWidth: "260px",
        desktopHeight: "390px",
        mobileWidth: "170px",
        mobileHeight: "255px",
    },
});
//# sourceMappingURL=app.js.map