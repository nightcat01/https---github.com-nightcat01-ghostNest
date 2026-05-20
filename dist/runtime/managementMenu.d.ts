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
export declare function renderManagementMenu({ action, targets, runActions, previewItem, currentItems, parentItems, menuTitle, display, }: RenderManagementMenuOptions): void;
export declare function closeManagementMenu(targets: ManagementMenuTargets): void;
export declare function resolveManagementMenuDisplay(action: OpenManagementMenuAction, options: ManagementMenuOptions | undefined): ManagementMenuDisplay;
export {};
//# sourceMappingURL=managementMenu.d.ts.map