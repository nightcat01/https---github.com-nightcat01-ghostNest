import { miraLines } from "./lines.js";
import { miraProfile } from "./profile.js";
import type { CharacterDefinition } from "../../core/types.js";

/**
 * Minimal character sample that relies on runtime defaults for visual assets.
 */
export const mira: CharacterDefinition = {
  profile: miraProfile,
  lines: miraLines,
};
