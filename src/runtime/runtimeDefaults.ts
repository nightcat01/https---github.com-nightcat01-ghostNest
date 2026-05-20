import type {
  CharacterSpriteSizeOptions,
  RuntimeFeatureOptions,
  RuntimeTimingOptions,
  SpeechTypingOptions,
} from "../core/types.js";

export const defaultTiming: RuntimeTimingOptions = {
  idleDelay: 18000,
  randomPromptDelay: 14000,
  randomPromptCooldown: 22000,
  randomPromptChance: 0.18,
  areaHoverCooldown: 5000,
};

export const defaultMaxLogItems = 8;

export const defaultFeatures = {
  commandHoverDescription: true,
} satisfies RuntimeFeatureOptions;

export const defaultSpriteSize = {
  desktopWidth: "220px",
  desktopHeight: "330px",
  mobileWidth: "154px",
  mobileHeight: "232px",
} satisfies CharacterSpriteSizeOptions;

export const defaultTyping = {
  enabled: true,
  interval: 28,
} satisfies SpeechTypingOptions;
