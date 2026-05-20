import type { ManagementMenuOptions } from "../core/types.js";

export const managementMenuStorageKey = "managementMenu.options";
export const runtimeUiStorageKey = "runtimeUi.options";

export type RuntimeUiPreferences = {
  balloonTheme?: string;
  balloonFontSize?: string;
  characterPosition?: {
    x: number;
    y: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function cloneManagementMenuOptions(options: ManagementMenuOptions | undefined): ManagementMenuOptions {
  return {
    ...options,
    displays: { ...options?.displays },
  };
}

export function readStoredManagementMenuOptions(value: unknown): ManagementMenuOptions {
  if (!isRecord(value)) {
    return {};
  }

  const options: ManagementMenuOptions = {};

  if (typeof value.defaultDisplay === "string") {
    options.defaultDisplay = value.defaultDisplay;
  }

  if (isRecord(value.displays)) {
    options.displays = Object.fromEntries(
      Object.entries(value.displays).filter(([, display]) => typeof display === "string"),
    ) as Record<string, string>;
  }

  return options;
}

export function readStoredRuntimeUiPreferences(value: unknown): RuntimeUiPreferences {
  if (!isRecord(value)) {
    return {};
  }

  const preferences: RuntimeUiPreferences = {};

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
