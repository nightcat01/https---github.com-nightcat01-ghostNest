import type { ManagementMenuDisplay, ManagementMenuOptions, RuntimeAction } from "../core/types.js";
type OpenManagementMenuAction = Extract<RuntimeAction, {
    type: "open_management_menu";
}>;
type RunActions = (actions: RuntimeAction[]) => void | Promise<void>;
export type ManagementMenuTargets = {
    balloon: HTMLElement | null;
    panel: HTMLElement | null;
};
type RenderManagementMenuOptions = {
    action: OpenManagementMenuAction;
    targets: ManagementMenuTargets;
    runActions: RunActions;
    previewItem?: ((item: OpenManagementMenuAction["items"][number]) => void) | undefined;
    currentItems?: OpenManagementMenuAction["items"];
    parentItems?: OpenManagementMenuAction["items"] | undefined;
    menuTitle?: string | undefined;
    display: ManagementMenuDisplay;
};
/**
 * Renders a management menu into the selected UI target.
 * The runtime owns action execution, while this renderer owns DOM shape and menu navigation.
 */
export declare function renderManagementMenu({ action, targets, runActions, previewItem, currentItems, parentItems, menuTitle, display, }: RenderManagementMenuOptions): void;
/**
 * Clears all management menu targets.
 */
export declare function closeManagementMenu(targets: ManagementMenuTargets): void;
/**
 * Resolves whether a menu should open in the balloon, panel, or a custom display slot.
 */
export declare function resolveManagementMenuDisplay(action: OpenManagementMenuAction, options: ManagementMenuOptions | undefined): ManagementMenuDisplay;
export {};
//# sourceMappingURL=managementMenu.d.ts.map