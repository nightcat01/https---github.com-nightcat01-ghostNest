import { rine } from "./characters/rine/index.js";
import { fortunePlugin } from "./plugins/fortune/index.js";
import { systemInfoPlugin } from "./plugins/systemInfo/index.js";
import { weatherPlugin } from "./plugins/weather/index.js";
import { timerPlugin } from "./plugins/timer/index.js";
import { createMinigamePlugin } from "./plugins/minigame/index.js";
import type { GhostRuntime } from "./core/types.js";
import { createGhostRuntime } from "./runtime/createGhostRuntime.js";

type GhostNestWindow = Window & {
  __ghostNestRuntime__?: GhostRuntime;
};

const ghostNestWindow = window as GhostNestWindow;

ghostNestWindow.__ghostNestRuntime__?.destroy();

const plugins = [
  fortunePlugin,
  systemInfoPlugin,
  weatherPlugin,
  timerPlugin,
  createMinigamePlugin("가위", (result) => console.log(result)),
  createMinigamePlugin("바위", (result) => console.log(result)),
  createMinigamePlugin("보", (result) => console.log(result)),
];

ghostNestWindow.__ghostNestRuntime__ = createGhostRuntime({
  character: rine,
  plugins,
  selectors: {
    stage: "#characterStage",
    sprite: "#characterSprite",
    spriteImage: "#characterSpriteImage",
    speakerName: "#speakerName",
    speechText: "#speechText",
    balloonActionMenu: "#balloonActionMenu",
    eventLog: "#eventLog",
    menuButtons: "[data-command], [data-plugin]",
    hitboxEditor: "#hitboxEditor",
    hitboxEditorAdd: "#hitboxEditorAdd",
    hitboxEditorClose: "#hitboxEditorClose",
    hitboxEditorBody: "#hitboxEditorBody",
    hitboxEditorCopy: "#hitboxEditorCopy",
    restoreBadge: "#restoreBadge",
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
    debugHitAreas: true,
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
