import type { GhostRuntime } from "./types.js";
/**
 * window.postMessage 등을 통해 외부에서 고스트 런타임으로 이벤트를 전달하는 브리지 역할을 합니다.
 */
export declare function createExternalEventBridge(runtime: GhostRuntime): {
    destroy: () => void;
};
//# sourceMappingURL=eventBridge.d.ts.map