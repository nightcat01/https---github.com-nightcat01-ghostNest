import type { DialogueScript, DialogueToken } from "./types.js";

export type DialogueScriptValidationOptions = {
  knownSurfaceIds?: string[];
  maxTokens?: number;
  maxTextLength?: number;
  maxSurfaceChanges?: number;
  minWaitMs?: number;
  maxWaitMs?: number;
};

export type DialogueScriptValidationResult =
  | {
      valid: true;
      script: DialogueScript;
      warnings: string[];
      errors: [];
    }
  | {
      valid: false;
      script: null;
      warnings: string[];
      errors: string[];
    };

const defaultOptions = {
  maxTokens: 80,
  maxTextLength: 2000,
  maxSurfaceChanges: 8,
  minWaitMs: 16,
  maxWaitMs: 30000,
} satisfies Required<Omit<DialogueScriptValidationOptions, "knownSurfaceIds">>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateToken(value: unknown, index: number): DialogueToken | string {
  if (!isRecord(value) || typeof value.type !== "string") {
    return `token[${index}] must be an object with a string type`;
  }

  switch (value.type) {
    case "text":
      return typeof value.value === "string"
        ? { type: "text", value: value.value }
        : `token[${index}].value must be a string`;
    case "wait":
      return typeof value.ms === "number" && Number.isFinite(value.ms) && value.ms >= 0
        ? { type: "wait", ms: value.ms }
        : `token[${index}].ms must be a non-negative number`;
    case "surface":
      return typeof value.id === "string" && value.id.length > 0
        ? { type: "surface", id: value.id }
        : `token[${index}].id must be a non-empty string`;
    case "clear":
      return { type: "clear" };
    case "newline":
      return { type: "newline" };
    case "choice":
      if (!Array.isArray(value.choices)) {
        return `token[${index}].choices must be an array`;
      }

      for (let choiceIndex = 0; choiceIndex < value.choices.length; choiceIndex += 1) {
        const choice = value.choices[choiceIndex];

        if (!isRecord(choice)) {
          return `token[${index}].choices[${choiceIndex}] must be an object`;
        }

        if (typeof choice.label !== "string" || choice.label.length === 0) {
          return `token[${index}].choices[${choiceIndex}].label must be a non-empty string`;
        }

        if (!Array.isArray(choice.actions)) {
          return `token[${index}].choices[${choiceIndex}].actions must be an array`;
        }
      }

      return {
        type: "choice",
        choices: value.choices.map((choice) => ({
          label: (choice as { label: string }).label,
          actions: (choice as { actions: [] }).actions,
        })),
      };
    case "end":
      return { type: "end" };
    default:
      return `token[${index}] has unknown type: ${value.type}`;
  }
}

export function validateDialogueScript(
  value: unknown,
  options: DialogueScriptValidationOptions = {},
): DialogueScriptValidationResult {
  const config = {
    ...defaultOptions,
    ...options,
  };
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!Array.isArray(value)) {
    return {
      valid: false,
      script: null,
      warnings,
      errors: ["script must be an array"],
    };
  }

  const script: DialogueScript = [];
  let textLength = 0;
  let surfaceChanges = 0;
  const knownSurfaceIds = new Set(options.knownSurfaceIds ?? []);

  value.forEach((tokenValue, index) => {
    const token = validateToken(tokenValue, index);

    if (typeof token === "string") {
      errors.push(token);
      return;
    }

    script.push(token);

    if (token.type === "text") {
      textLength += Array.from(token.value).length;
    }

    if (token.type === "wait" && token.ms > 0 && token.ms < config.minWaitMs) {
      warnings.push(`token[${index}].ms is shorter than ${config.minWaitMs}ms`);
    }

    if (token.type === "wait" && token.ms > config.maxWaitMs) {
      warnings.push(`token[${index}].ms is longer than ${config.maxWaitMs}ms`);
    }

    if (token.type === "surface") {
      surfaceChanges += 1;

      if (knownSurfaceIds.size > 0 && !knownSurfaceIds.has(token.id)) {
        warnings.push(`token[${index}] references unknown surface id: ${token.id}`);
      }
    }
  });

  if (value.length > config.maxTokens) {
    warnings.push(`script has ${value.length} tokens; recommended maximum is ${config.maxTokens}`);
  }

  if (textLength > config.maxTextLength) {
    warnings.push(`script has ${textLength} text characters; recommended maximum is ${config.maxTextLength}`);
  }

  if (surfaceChanges > config.maxSurfaceChanges) {
    warnings.push(`script changes surface ${surfaceChanges} times; recommended maximum is ${config.maxSurfaceChanges}`);
  }

  if (!script.some((token) => token.type === "end")) {
    warnings.push("script has no end token");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      script: null,
      warnings,
      errors,
    };
  }

  return {
    valid: true,
    script,
    warnings,
    errors: [],
  };
}
