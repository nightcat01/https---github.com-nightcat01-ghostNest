import type { GhostRuntime } from "./core/types.js";
import { nanikaPreset } from "./ghost/preset.js";
import { createGhostRuntimeFromPreset } from "./plugins/nanikaMapping/index.js";

type GhostNestWindow = Window & {
  __ghostNestRuntime__?: GhostRuntime;
};

const ghostNestWindow = window as GhostNestWindow;

ghostNestWindow.__ghostNestRuntime__?.destroy();

/**
 * Boots the runtime from the current Nanika preset.
 */
ghostNestWindow.__ghostNestRuntime__ = createGhostRuntimeFromPreset(nanikaPreset);
