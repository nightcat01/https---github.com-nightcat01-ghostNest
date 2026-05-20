import { rineLines } from "./lines.js";
import { rineProfile } from "./profile.js";
export const rine = {
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
        surfaces: {
            "0": {
                id: "0",
                image: "./src/characters/rine/rine_standing_defualt.png",
                expression: "neutral",
                alt: "기본 표정의 리네",
                layers: {
                    base: {
                        image: "./src/characters/rine/rine_standing_defualt.png",
                    },
                    mouth: {
                        frames: [
                            "./src/characters/rine/rine_standing_defualt_mouth_close.png",
                            "./src/characters/rine/rine_standing_defualt_mouth_small.png",
                        ],
                        intervalMs: 140,
                        coversBase: true,
                    },
                },
            },
            "5": {
                id: "5",
                image: "./src/characters/rine/rine_standing_thinking.png",
                alt: "생각하는 표정의 리네",
            },
            "8": {
                id: "8",
                image: "./src/characters/rine/rine_standing_wink.png",
                alt: "윙크하는 리네",
            },
        },
        hitAreas: {
            head: { minX: 0.2, maxX: 0.8, minY: 0.0, maxY: 0.35 },
            face: { minX: 0.22, maxX: 0.78, minY: 0.35, maxY: 0.58 },
            body: { minX: 0.1, maxX: 0.9, minY: 0.58, maxY: 1.0 },
        },
    },
};
//# sourceMappingURL=index.js.map