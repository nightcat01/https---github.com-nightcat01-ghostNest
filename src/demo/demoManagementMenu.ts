import type { CharacterDefinition, ManagementMenuItem } from "../core/types.js";
import { createCharacterMenuItems } from "./menuPresets/characterMenuItems.js";
import { createDeveloperMenuItems } from "./menuPresets/developerMenuItems.js";
import { createDialogueMenuItems } from "./menuPresets/dialogueMenuItems.js";
import { createPluginMenuItems } from "./menuPresets/pluginMenuItems.js";
import { createUiMenuItems } from "./menuPresets/uiMenuItems.js";

export type DemoManagementMenuOptions = {
  includeDeveloperTools?: boolean;
  includeUserMenus?: boolean;
  includePluginMenus?: boolean;
  includeCharacterMenus?: boolean;
};

function createDeveloperToolsMenuItem(): ManagementMenuItem {
  return {
    id: "developer-tools",
    label: "개발자 도구",
    description: "개발 중 확인용 도구를 모아둔 메뉴예요.",
    children: createDeveloperMenuItems(),
  };
}

/**
 * Creates the demo management menu tree.
 * The menu shows common action patterns such as plugins, nested choices, UI settings, and devtools.
 */
export function createDemoManagementMenuItems(
  character?: CharacterDefinition,
  options: DemoManagementMenuOptions = {},
): ManagementMenuItem[] {
  const includeUserMenus = options.includeUserMenus ?? true;
  const includePluginMenus = options.includePluginMenus ?? true;
  const includeCharacterMenus = options.includeCharacterMenus ?? true;
  const menuItems = [
    ...(includeUserMenus ? createDialogueMenuItems() : []),
    ...(includePluginMenus ? createPluginMenuItems() : []),
    ...(includeUserMenus ? createUiMenuItems() : []),
    ...(includeCharacterMenus ? createCharacterMenuItems(character) : []),
  ];

  if (options.includeDeveloperTools) {
    menuItems.splice(Math.max(0, menuItems.length - 1), 0, createDeveloperToolsMenuItem());
  }

  return menuItems;
}

/**
 * Creates user-facing menu items without developer-only tools.
 */
export function createDemoUserMenuItems(character?: CharacterDefinition): ManagementMenuItem[] {
  return createDemoManagementMenuItems(character, {
    includeDeveloperTools: false,
    includeUserMenus: true,
    includePluginMenus: true,
    includeCharacterMenus: true,
  });
}

/**
 * Creates developer-facing menu items for integration and diagnostics.
 */
export function createDemoDeveloperMenuItems(): ManagementMenuItem[] {
  return [createDeveloperToolsMenuItem()];
}
