import { fortunePlugin } from "../plugins/fortune/index.js";
import { createMinigamePlugin } from "../plugins/minigame/index.js";
import { systemInfoPlugin } from "../plugins/systemInfo/index.js";
import { timerPlugin } from "../plugins/timer/index.js";
import { weatherPlugin } from "../plugins/weather/index.js";
/**
 * Creates the demo plugin set used by the default GhostNest sample.
 * Replace this preset in src/ghost/nanika.config.ts when wiring real API, DB, or AI features.
 */
export function createDemoPlugins() {
    return [
        fortunePlugin,
        systemInfoPlugin,
        weatherPlugin,
        timerPlugin,
        createMinigamePlugin("가위", (result) => console.log(result)),
        createMinigamePlugin("바위", (result) => console.log(result)),
        createMinigamePlugin("보", (result) => console.log(result)),
    ];
}
//# sourceMappingURL=demoPlugins.js.map