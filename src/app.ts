import { rine } from "./characters/rine/index.js";
import type { GhostRuntime } from "./core/types.js";
import { createDemoPlugins } from "./demo/demoPlugins.js";
import { createDemoRules } from "./demo/demoRules.js";
import { createGhostRuntime } from "./runtime/createGhostRuntime.js";

type GhostNestWindow = Window & {
  __ghostNestRuntime__?: GhostRuntime;
};

const ghostNestWindow = window as GhostNestWindow;

ghostNestWindow.__ghostNestRuntime__?.destroy();

ghostNestWindow.__ghostNestRuntime__ = createGhostRuntime({
  character: rine,
  plugins: createDemoPlugins(),
  rules: createDemoRules(),
  selectors: {
    stage: "#characterStage",
    sprite: "#characterSprite",
    spriteImage: "#characterSpriteImage",
    speechBalloon: "#speechBalloon",
    speakerName: "#speakerName",
    speechText: "#speechText",
    balloonActionMenu: "#balloonActionMenu",
    panelActionMenu: "#panelActionMenu",
    menuButtons: "[data-command], [data-plugin]",
    restoreBadge: "#restoreBadge",
    observeAreas: "[data-observe-area]",
  },
  devtools: {
    diagnostics: {
      selectors: {
        eventLog: "#eventLog",
        statusMode: "#statusMode",
        statusExpression: "#statusExpression",
        statusVisibility: "#statusVisibility",
        statusLastEvent: "#statusLastEvent",
        statusIdleCountdown: "#statusIdleCountdown",
        statusRandomPrompt: "#statusRandomPrompt",
        statusActionTimers: "#statusActionTimers",
      },
    },
    hitboxEditor: {
      selectors: {
        editor: "#hitboxEditor",
        addButton: "#hitboxEditorAdd",
        closeButton: "#hitboxEditorClose",
        body: "#hitboxEditorBody",
        copyButton: "#hitboxEditorCopy",
      },
    },
  },
  managementMenu: {
    defaultDisplay: "balloon",
    displays: {
      "system-tools": "panel",
    },
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
