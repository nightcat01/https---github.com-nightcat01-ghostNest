export const managementMenuStorageKey = "managementMenu.options";
export const runtimeUiStorageKey = "runtimeUi.options";
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
export function cloneManagementMenuOptions(options) {
    return {
        ...options,
        displays: { ...options?.displays },
    };
}
export function readStoredManagementMenuOptions(value) {
    if (!isRecord(value)) {
        return {};
    }
    const options = {};
    if (typeof value.defaultDisplay === "string") {
        options.defaultDisplay = value.defaultDisplay;
    }
    if (isRecord(value.displays)) {
        options.displays = Object.fromEntries(Object.entries(value.displays).filter(([, display]) => typeof display === "string"));
    }
    return options;
}
export function readStoredRuntimeUiPreferences(value) {
    if (!isRecord(value)) {
        return {};
    }
    const preferences = {};
    if (typeof value.balloonTheme === "string") {
        preferences.balloonTheme = value.balloonTheme;
    }
    if (typeof value.balloonFontSize === "string") {
        preferences.balloonFontSize = value.balloonFontSize;
    }
    if (isRecord(value.characterPosition)) {
        const { x, y } = value.characterPosition;
        if (typeof x === "number" && typeof y === "number") {
            preferences.characterPosition = { x, y };
        }
    }
    return preferences;
}
//# sourceMappingURL=runtimePreferences.js.map