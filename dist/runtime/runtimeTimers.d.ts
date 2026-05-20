import type { RuntimeEventMap, RuntimeEventName, RuntimeState, RuntimeTimingOptions } from "../core/types.js";
type RuntimeEventEmitter = {
    emit: <TEventName extends RuntimeEventName>(eventName: TEventName, payload?: RuntimeEventMap[TEventName]) => void;
};
type StartRuntimeTimersOptions = {
    eventBus: RuntimeEventEmitter;
    state: RuntimeState;
    timing: RuntimeTimingOptions;
    renderStatusPanel: () => void;
    touchInteraction: () => void;
};
export declare function startRuntimeTimers({ eventBus, state, timing, renderStatusPanel, touchInteraction, }: StartRuntimeTimersOptions): () => void;
export {};
//# sourceMappingURL=runtimeTimers.d.ts.map