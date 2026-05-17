import type { RuntimeEventHandler, RuntimeEventMap, RuntimeEventName } from "./types.js";
/**
 * 런타임 내부 이벤트를 구독하고 발행하는 타입 안전 이벤트 버스를 만듭니다.
 */
export declare function createEventBus(): {
    on: <TEventName extends RuntimeEventName>(eventName: TEventName, handler: RuntimeEventHandler<TEventName>) => () => void;
    emit: <TEventName extends RuntimeEventName>(eventName: TEventName, payload?: RuntimeEventMap[TEventName]) => void;
};
//# sourceMappingURL=eventBus.d.ts.map