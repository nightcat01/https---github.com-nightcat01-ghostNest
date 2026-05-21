import type { ManagementMenuItem, RuntimeRule } from "../core/types.js";
import { createDemoManagementMenuItems } from "./demoManagementMenu.js";

/**
 * Creates demo event rules that show how runtime events map to actions.
 * Pass menu items from the caller when the host wants to customize the demo menu tree.
 */
export function createDemoRules(menuItems: ManagementMenuItem[] = createDemoManagementMenuItems()): RuntimeRule[] {
  return [
    {
      id: "demo.character.right_click.management_menu",
      event: "character:right_click",
      actions: [
        { type: "touch_interaction" },
        { type: "change_expression", expression: "thinking", clearTouchedPart: true },
        { type: "speak_text", text: "관리 메뉴를 열었어요. 필요한 동작을 골라주세요." },
        {
          type: "open_management_menu",
          title: "관리 메뉴",
          items: menuItems,
        },
        { type: "log", label: "character:right_click.management_menu" },
      ],
    },
    {
      id: "demo.command.hover.fortune",
      event: "command:hover",
      when: { command: "fortune" },
      conditions: [{ type: "feature_enabled", feature: "commandHoverDescription" }],
      actions: [
        { type: "touch_interaction" },
        { type: "change_expression", expression: "thinking", clearTouchedPart: true },
        { type: "speak", category: "onHoverFortuneCommand" },
        { type: "log", label: "command:hover.fortune" },
      ],
    },
    {
      id: "demo.command.fortune",
      event: "command:fortune",
      actions: [
        { type: "touch_interaction" },
        { type: "call_plugin", pluginId: "fortune" },
        { type: "log", label: "plugin:fortune.execute" },
      ],
    },
  ];
}
