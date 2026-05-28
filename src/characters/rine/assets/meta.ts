import type { CharacterAssets } from "../../../core/types.js";

export const rineAssetMeta = {
  "alt": "여우족 안내자 리네",
  "hitAreas": {
    "head": {
      "minX": 0.2,
      "maxX": 0.8,
      "minY": 0,
      "maxY": 0.35
    },
    "face": {
      "minX": 0.22,
      "maxX": 0.78,
      "minY": 0.35,
      "maxY": 0.58
    },
    "body": {
      "minX": 0.1,
      "maxX": 0.9,
      "minY": 0.58,
      "maxY": 1
    }
  }
} satisfies Pick<CharacterAssets, "alt" | "hitAreas">;
