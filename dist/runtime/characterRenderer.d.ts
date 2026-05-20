import type { CharacterDefinition, CharacterLayerId, CharacterRuntimeMode, RuntimeState } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";
type CharacterRendererOptions = {
    elements: RuntimeElements;
    character: CharacterDefinition;
};
export declare function createCharacterRenderer({ elements, character }: CharacterRendererOptions): {
    applySurface: (surfaceId: string) => void;
    destroy: () => void;
    renderState: (state: Pick<RuntimeState, "expression" | "lastTouchedPart">) => void;
    setLayerAnimationActive: (layerId: CharacterLayerId, isActive: boolean) => void;
    setMode: (mode: CharacterRuntimeMode) => void;
    setMouthAnimationActive: (isActive: boolean) => void;
};
export {};
//# sourceMappingURL=characterRenderer.d.ts.map