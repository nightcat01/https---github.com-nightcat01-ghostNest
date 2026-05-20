import type { ManagementMenuOptions } from "../core/types.js";
export declare const managementMenuStorageKey = "managementMenu.options";
export declare const runtimeUiStorageKey = "runtimeUi.options";
export type RuntimeUiPreferences = {
    balloonTheme?: string;
    balloonFontSize?: string;
    characterPosition?: {
        x: number;
        y: number;
    };
};
export declare function cloneManagementMenuOptions(options: ManagementMenuOptions | undefined): ManagementMenuOptions;
export declare function readStoredManagementMenuOptions(value: unknown): ManagementMenuOptions;
export declare function readStoredRuntimeUiPreferences(value: unknown): RuntimeUiPreferences;
//# sourceMappingURL=runtimePreferences.d.ts.map