import type { CharacterDefinition, HitboxEditorDevtoolSelectors } from "../core/types.js";
import type { RuntimeElements } from "../runtime/domElements.js";
type InitHitboxEditorOptions = {
    elements: RuntimeElements;
    character: CharacterDefinition;
    selectors: HitboxEditorDevtoolSelectors;
};
export declare function initHitboxEditor({ elements, character, selectors }: InitHitboxEditorOptions): {
    renderDebugHitAreas: () => void;
    destroy(): void;
};
export {};
//# sourceMappingURL=hitboxEditor.d.ts.map