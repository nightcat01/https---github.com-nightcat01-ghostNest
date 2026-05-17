import { rineLines } from "./lines.js";
import { rineProfile } from "./profile.js";
import type { CharacterDefinition } from "../../core/types.js";

export const rine: CharacterDefinition = {
  profile: rineProfile,
  lines: rineLines,
  assets: {
    alt: "여우족 안내자 리네",
    expressions: {
      neutral: "./src/characters/rine/rine_standing_defualt.png",
      happy: [
        "./src/characters/rine/rine_standing_wink.png",
        "./src/characters/rine/rine_standing_defualt.png",
      ],
      thinking: [
        "./src/characters/rine/rine_standing_thinking.png",
        "./src/characters/rine/rine_standing_wink.png",
      ],
      surprised: [
        "./src/characters/rine/rine_standing_surprise.png",
        "./src/characters/rine/rine_standing_shy.png",
      ],
    },
  },
};
