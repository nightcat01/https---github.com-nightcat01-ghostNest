import type { RuntimeAction, RuntimeEventHandler, RuntimeEventName, RuntimeFeatureOptions, RuntimeRule, RuntimeState } from "../core/types.js";
type RuntimeEventBus = {
    on: <TEventName extends RuntimeEventName>(eventName: TEventName, handler: RuntimeEventHandler<TEventName>) => () => void;
};
type RuleRunnerOptions = {
    eventBus: RuntimeEventBus;
    rules: RuntimeRule[];
    features: RuntimeFeatureOptions;
    state: RuntimeState;
    ruleCooldowns: Map<string, number>;
    runActions: (actions: RuntimeAction[]) => void | Promise<void>;
    setLastEventLabel: (eventName: RuntimeEventName) => void;
};
export declare function bindRuntimeRuleEvents(options: RuleRunnerOptions): void;
export {};
//# sourceMappingURL=ruleRunner.d.ts.map