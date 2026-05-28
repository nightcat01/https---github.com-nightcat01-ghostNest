import type { ManagementMenuItem } from "../../core/types.js";

export type NanikaMappingExtensionConfig = {
  enabled: boolean;
};

export const nanikaMappingExtension = {
  id: "nanika-mapping",
  name: "Nanika Mapping",
  description: "Developer extension page for connecting characters, capabilities, events, and actions.",
  route: "./dev-nanika-mapping.html",
  capabilities: [
    "runtime-action-catalog",
    "runtime-event-catalog",
    "plugin-capability-catalog",
    "rule-mapping-preview",
  ],
} as const;

export const nanikaMappingExtensionConfig = {
  enabled: true,
} satisfies NanikaMappingExtensionConfig;

/**
 * Creates the developer menu entry that opens Nanika mapping tools.
 */
export function createNanikaMappingMenuItem(): ManagementMenuItem {
  return {
    id: nanikaMappingExtension.id,
    label: nanikaMappingExtension.name,
    description: nanikaMappingExtension.description,
    actions: [
      { type: "close_management_menu" },
      { type: "navigate", route: nanikaMappingExtension.route },
      { type: "log", label: "management.open_nanika_mapping" },
    ],
  };
}
