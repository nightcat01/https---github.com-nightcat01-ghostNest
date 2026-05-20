import type { CharacterDefinition } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";
type InitHitboxEditorOptions = {
    elements: RuntimeElements;
    character: CharacterDefinition;
};
export declare function initHitboxEditor({ elements, character }: InitHitboxEditorOptions): {
    renderDebugHitAreas: () => void;
    destroy(): void;
};
export {};
//# sourceMappingURL=hitboxEditor.d.ts.map