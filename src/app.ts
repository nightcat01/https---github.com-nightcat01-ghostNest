import type { GhostRuntime } from "./core/types.js";
import { nanikaRules } from "./ghost/actions.js";
import { character } from "./ghost/character.js";
import { nanikaConfig } from "./ghost/nanika.config.js";
import { createGhostRuntime } from "./runtime/createGhostRuntime.js";

type GhostNestWindow = Window & {
  __ghostNestRuntime__?: GhostRuntime;
};

const ghostNestWindow = window as GhostNestWindow;

ghostNestWindow.__ghostNestRuntime__?.destroy();

/**
 * Boots the runtime from the three developer-facing surfaces:
 * character selection, Nanika configuration, and action rules.
 */
ghostNestWindow.__ghostNestRuntime__ = createGhostRuntime({
  ...nanikaConfig,
  character,
  rules: nanikaRules,
});
