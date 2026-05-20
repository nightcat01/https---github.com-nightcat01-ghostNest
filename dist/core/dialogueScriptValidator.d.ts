import type { DialogueScript } from "./types.js";
export type DialogueScriptValidationOptions = {
    knownSurfaceIds?: string[];
    maxTokens?: number;
    maxTextLength?: number;
    maxSurfaceChanges?: number;
    minWaitMs?: number;
    maxWaitMs?: number;
};
export type DialogueScriptValidationResult = {
    valid: true;
    script: DialogueScript;
    warnings: string[];
    errors: [];
} | {
    valid: false;
    script: null;
    warnings: string[];
    errors: string[];
};
export declare function validateDialogueScript(value: unknown, options?: DialogueScriptValidationOptions): DialogueScriptValidationResult;
//# sourceMappingURL=dialogueScriptValidator.d.ts.map