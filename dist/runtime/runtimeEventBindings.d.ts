import type { CharacterDefinition, RuntimeAction, RuntimeEventMap, RuntimeEventName } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";
type RuntimeEventEmitter = {
    emit: <TEventName extends RuntimeEventName>(eventName: TEventName, payload?: RuntimeEventMap[TEventName]) => void;
};
type BindRuntimeDomEventsOptions = {
    elements: RuntimeElements;
    eventBus: RuntimeEventEmitter;
    character: CharacterDefinition;
    cleanupCallbacks: Array<() => void>;
    touchInteraction: () => void;
    runAction: (action: RuntimeAction) => void | Promise<void>;
    shouldSkipDialogue?: () => boolean;
    skipDialogue?: () => void;
};
export declare function bindRuntimeDomEvents({ elements, eventBus, character, cleanupCallbacks, touchInteraction, runAction, shouldSkipDialogue, skipDialogue, }: BindRuntimeDomEventsOptions): void;
export {};
//# sourceMappingURL=runtimeEventBindings.d.ts.map