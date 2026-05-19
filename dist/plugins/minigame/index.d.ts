import type { RuntimePlugin } from "../../core/types.js";
type MinigameChoice = "가위" | "바위" | "보";
export declare function createMinigamePlugin(choice: MinigameChoice, onResult: (result: "win" | "lose" | "draw") => void): RuntimePlugin;
export {};
//# sourceMappingURL=index.d.ts.map