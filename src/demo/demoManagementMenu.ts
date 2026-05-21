import type { CharacterDefinition, ManagementMenuItem } from "../core/types.js";
import { createCharacterMenuItems } from "./menuPresets/characterMenuItems.js";
import { createDeveloperMenuItems } from "./menuPresets/developerMenuItems.js";
import { createDialogueMenuItems } from "./menuPresets/dialogueMenuItems.js";
import { createPluginMenuItems } from "./menuPresets/pluginMenuItems.js";
import { createUiMenuItems } from "./menuPresets/uiMenuItems.js";

export type DemoManagementMenuOptions = {
  includeDeveloperTools?: boolean;
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
  const menuItems = [
    ...createDialogueMenuItems(),
    ...createPluginMenuItems(),
    ...createUiMenuItems(),
    ...createCharacterMenuItems(character),
  ];

  if (options.includeDeveloperTools) {
    menuItems.splice(Math.max(0, menuItems.length - 1), 0, createDeveloperToolsMenuItem());
  }

  return menuItems;
}
