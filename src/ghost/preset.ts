import { defineNanikaRuntimePreset } from "../plugins/nanikaMapping/index.js";
import { nanikaRules } from "./actions.js";
import { character } from "./character.js";
import { nanikaConfig } from "./nanika.config.js";

/**
 * Groups the current service Nanika into one bootable preset.
 */
export const nanikaPreset = defineNanikaRuntimePreset({
  id: "ghost-nest.demo.nanika",
  name: "GhostNest Demo Nanika",
  character,
  plugins: nanikaConfig.plugins,
  rules: nanikaRules,
  options: nanikaConfig,
});
