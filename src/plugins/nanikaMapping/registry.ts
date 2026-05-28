import { runtimeActionCatalog } from "./actionCatalog.js";
import { createCapabilityCatalogFromPlugins } from "./capabilityCatalog.js";
import { createCharacterCatalogItem } from "./characterCatalog.js";
import { runtimeEventCatalog } from "./eventCatalog.js";
import type { NanikaRuntimePreset } from "./preset.js";

export type NanikaMappingRegistry = ReturnType<typeof createNanikaMappingRegistry>;

/**
 * Collects mapping editor source lists behind one plugin-facing entry point.
 */
export function createNanikaMappingRegistry(preset: NanikaRuntimePreset) {
  const plugins = preset.plugins ?? preset.options.plugins ?? [];

  return {
    preset: {
      id: preset.id,
      name: preset.name ?? preset.id,
    },
    character: createCharacterCatalogItem(preset.character),
    actions: runtimeActionCatalog,
    events: runtimeEventCatalog,
    capabilities: preset.capabilities ?? createCapabilityCatalogFromPlugins(plugins),
    mappings: preset.rules ?? [],
    plugins,
  };
}
