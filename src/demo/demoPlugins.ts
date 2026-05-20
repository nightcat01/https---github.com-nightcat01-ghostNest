import { fortunePlugin } from "../plugins/fortune/index.js";
import { createMinigamePlugin } from "../plugins/minigame/index.js";
import { systemInfoPlugin } from "../plugins/systemInfo/index.js";
import { timerPlugin } from "../plugins/timer/index.js";
import { weatherPlugin } from "../plugins/weather/index.js";
import type { RuntimePlugin } from "../core/types.js";

export function createDemoPlugins(): RuntimePlugin[] {
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
