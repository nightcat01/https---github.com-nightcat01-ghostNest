import { rineLines } from "./lines.js";
import { rineProfile } from "./profile.js";
import type { CharacterDefinition } from "../../core/types.js";

/**
 * Full character sample with expression images, DialogueScript surfaces, layers, and hit areas.
 */
export const rine: CharacterDefinition = {
  profile: rineProfile,
  lines: rineLines,
  assets: {
        "alt": "여우족 안내자 리네",
        "expressions": {
          "neutral": "./src/characters/rine/assets/base/rine_standing_defualt.png",
          "happy": [
            "./src/characters/rine/assets/base/rine_standing_wink.png",
            "./src/characters/rine/assets/base/rine_standing_defualt.png"
          ],
          "thinking": [
            "./src/characters/rine/assets/base/rine_standing_thinking.png",
            "./src/characters/rine/assets/base/rine_standing_wink.png"
          ],
          "surprised": [
            "./src/characters/rine/assets/base/rine_standing_surprise.png",
            "./src/characters/rine/assets/base/rine_standing_shy.png"
          ]
        },
        "surfaces": {
          "0": {
            "id": "0",
            "image": "./src/characters/rine/assets/base/rine_standing_defualt.png",
            "expression": "neutral",
            "alt": "기본 표정의 리네",
            "layers": {
              "base": {
                "frames": [],
                "depth": 0,
                "intervalMs": 300,
                "idleIntervalMs": 1000,
                "coversBase": false,
                "placement": {
                  "x": 38.5,
                  "y": 12.9,
                  "width": 13.8,
                  "height": 5.2,
                  "unit": "percent"
                }
              },
              "mouth": {
                "frames": [
                  "./src/characters/rine/assets/parts/rine_mouth_big.png"
                ],
                "depth": 30,
                "intervalMs": 140,
                "coversBase": true,
                "placement": {
                  "x": 43.6,
                  "y": 18,
                  "width": 5.1,
                  "height": 2.1,
                  "unit": "percent"
                }
              },
              "eyes": {
                "frames": [
                  "./src/characters/rine/assets/parts/rine_eye_close.png"
                ],
                "depth": 20,
                "intervalMs": 300,
                "idleIntervalMs": 2000,
                "coversBase": false,
                "placement": {
                  "x": 38.5,
                  "y": 12.9,
                  "width": 13.8,
                  "height": 5.2,
                  "unit": "percent"
                }
              }
            }
          },
          "5": {
            "id": "5",
            "image": "./src/characters/rine/assets/base/rine_standing_thinking.png",
            "alt": "생각하는 표정의 리네"
          },
          "8": {
            "id": "8",
            "image": "./src/characters/rine/assets/base/rine_standing_wink.png",
            "alt": "윙크하는 리네"
          }
        },
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
      },
};
