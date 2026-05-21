import type { CharacterDefinition, HitboxEditorDevtoolSelectors, StorageAdapter } from "../core/types.js";
import type { RuntimeElements } from "../runtime/domElements.js";
type InitHitboxEditorOptions = {
    elements: RuntimeElements;
    character: CharacterDefinition;
    selectors: HitboxEditorDevtoolSelectors;
    storageAdapter: StorageAdapter;
};
export declare function initHitboxEditor({ elements, character, selectors, storageAdapter }: InitHitboxEditorOptions): {
    renderDebugHitAreas: () => void;
    destroy(): void;
};
export {};
//# sourceMappingURL=hitboxEditor.d.ts.map