import type { CharacterDefinition, ManagementMenuItem } from "../core/types.js";
export type DemoManagementMenuOptions = {
    includeDeveloperTools?: boolean;
};
/**
 * Creates the demo management menu tree.
 * The menu shows common action patterns such as plugins, nested choices, UI settings, and devtools.
 */
export declare function createDemoManagementMenuItems(character?: CharacterDefinition, options?: DemoManagementMenuOptions): ManagementMenuItem[];
//# sourceMappingURL=demoManagementMenu.d.ts.map