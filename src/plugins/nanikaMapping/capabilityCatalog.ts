import type { RuntimePlugin } from "../../core/types.js";

export type RuntimeCapabilityKind = "plugin";

export type RuntimeCapabilityCatalogItem = {
  id: string;
  kind: RuntimeCapabilityKind;
  name: string;
  description?: string;
  action: {
    type: "call_plugin";
    pluginId: string;
  };
};

/**
 * Converts registered plugins into capability records that mapping editors can show.
 */
export function createCapabilityCatalogFromPlugins(
  plugins: readonly RuntimePlugin[] = [],
): RuntimeCapabilityCatalogItem[] {
  return plugins.map((plugin) => {
    const item: RuntimeCapabilityCatalogItem = {
      id: plugin.id,
      kind: "plugin",
      name: plugin.name,
      action: {
        type: "call_plugin",
        pluginId: plugin.id,
      },
    };

    if (plugin.description) {
      item.description = plugin.description;
    }

    return item;
  });
}
