import { createDemoPlugins } from "../demo/demoPlugins.js";
/**
 * Registers feature providers that GhostNest can call through mapped actions.
 * Replace these plugins with API, DB, AI, or app-specific adapters in a real service.
 */
const externalFeatures = [
    ...createDemoPlugins(),
];
/**
 * Connects the runtime to DOM nodes owned by the host page.
 * Change these selectors when embedding GhostNest into a different layout.
 */
const runtimeSelectors = {
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
};
/**
 * Wires optional developer tools without mixing them into user-facing actions.
 * These can be removed or replaced when shipping a production-only build.
 */
const devtoolOptions = {
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
};
/**
 * Defines where management menus open by default and per menu id.
 * Developers can keep global menus in the balloon while moving heavier tools to panels.
 */
const managementMenuOptions = {
    defaultDisplay: "balloon",
    displays: {
        "system-tools": "panel",
    },
};
/**
 * Toggles runtime behaviors that are useful to expose during integration.
 */
const featureOptions = {
    commandHoverDescription: true,
    debugHitAreas: true,
};
/**
 * Controls the dialogue typing effect shared by plain text and DialogueScript output.
 */
const typingOptions = {
    enabled: true,
    interval: 26,
};
/**
 * Sets the rendered character size for desktop and mobile breakpoints.
 */
const spriteSizeOptions = {
    desktopWidth: "260px",
    desktopHeight: "390px",
    mobileWidth: "170px",
    mobileHeight: "255px",
};
/**
 * Developer-facing Nanika configuration.
 * Character data and action rules are imported separately so the three public surfaces stay clear.
 */
export const nanikaConfig = {
    plugins: externalFeatures,
    selectors: runtimeSelectors,
    devtools: devtoolOptions,
    managementMenu: managementMenuOptions,
    features: featureOptions,
    typing: typingOptions,
    spriteSize: spriteSizeOptions,
};
//# sourceMappingURL=nanika.config.js.map