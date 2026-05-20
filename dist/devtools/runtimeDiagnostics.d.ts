import type { RuntimeDiagnosticsDevtoolSelectors, RuntimeEventName, RuntimeState, RuntimeTimingOptions } from "../core/types.js";
type RuntimeDiagnosticsOptions = {
    selectors?: RuntimeDiagnosticsDevtoolSelectors | undefined;
    state: RuntimeState;
    timing: RuntimeTimingOptions;
    actionTimers: Map<string, number>;
    maxLogItems: number;
};
export declare function createRuntimeDiagnostics({ selectors, state, timing, actionTimers, maxLogItems, }: RuntimeDiagnosticsOptions): {
    addLog: (label: string) => void;
    renderStatusPanel: () => void;
    setLastEventLabel: (eventName: RuntimeEventName) => void;
};
export {};
//# sourceMappingURL=runtimeDiagnostics.d.ts.map