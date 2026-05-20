import type { DialogueEngine, ManagementMenuOptions, DialogueMessage, RuntimeAction, RuntimeActionHandler, RuntimeEventMap, RuntimeEventName, RuntimePlugin, RuntimeState, StorageAdapter } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";
type RuntimeEventEmitter = {
    emit: <TEventName extends RuntimeEventName>(eventName: TEventName, payload?: RuntimeEventMap[TEventName]) => void;
};
type ActionRunnerContext = {
    elements: RuntimeElements;
    state: RuntimeState;
    dialogue: DialogueEngine;
    pluginRegistry: Map<string, RuntimePlugin>;
    storageAdapter: StorageAdapter;
    actionTimers: Map<string, number>;
    managementMenu?: ManagementMenuOptions | undefined;
    eventBus: RuntimeEventEmitter;
    renderSpeech: (message: DialogueMessage) => void;
    renderPreviewSpeech: (message: DialogueMessage) => void;
    renderCharacterState: () => void;
    setLayerAnimationActive: (layerId: string, isActive: boolean) => void;
    addLog: (label: string) => void;
    touchInteraction: () => void;
};
export declare function createActionRunner(context: ActionRunnerContext): {
    runAction: (action: RuntimeAction) => Promise<void>;
    runActions: (actions: RuntimeAction[]) => Promise<void>;
    registerAction: (type: string, handler: RuntimeActionHandler) => void;
};
export {};
//# sourceMappingURL=actionRunner.d.ts.map