import { miraLines } from "./lines.js";
import { miraProfile } from "./profile.js";
import type { CharacterDefinition } from "../../core/types.js";

export const mira: CharacterDefinition = {
  profile: miraProfile,
  lines: miraLines,
};
