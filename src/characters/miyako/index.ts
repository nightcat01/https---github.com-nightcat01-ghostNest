import { miyakoLines } from "./lines.js";
import { miyakoProfile } from "./profile.js";
import type { CharacterDefinition } from "../../core/types.js";

const miyakoSitImage = "./src/characters/miyako/assets/base/miyako_sit.png";

/**
 * Single-image character definition created from the Miyako sitting asset.
 */
export const miyako: CharacterDefinition = {
  profile: miyakoProfile,
  lines: miyakoLines,
  assets: {
    alt: "오미쿠지 접수대의 미야코",
    expressions: {
      neutral: miyakoSitImage,
      happy: miyakoSitImage,
      thinking: miyakoSitImage,
      surprised: miyakoSitImage,
    },
    surfaces: {
      "0": {
        id: "0",
        image: miyakoSitImage,
        expression: "neutral",
        alt: "접수대에 앉아 있는 미야코",
      },
    },
    hitAreas: {
      head: {
        minX: 0.38,
        maxX: 0.62,
        minY: 0.02,
        maxY: 0.34,
      },
      face: {
        minX: 0.4,
        maxX: 0.6,
        minY: 0.18,
        maxY: 0.39,
      },
      body: {
        minX: 0.3,
        maxX: 0.7,
        minY: 0.34,
        maxY: 0.76,
      },
    },
  },
};
