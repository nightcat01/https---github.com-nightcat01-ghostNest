/**
 * window.postMessage 등을 통해 외부에서 고스트 런타임으로 이벤트를 전달하는 브리지 역할을 합니다.
 */
export function createExternalEventBridge(runtime) {
    function handleMessage(event) {
        // 보안: 필요한 경우 event.origin 체크를 추가할 수 있습니다.
        const data = event.data;
        if (!data || typeof data !== "object" || data.type !== "ghostnest:command") {
            return;
        }
        // 예: { type: "ghostnest:command", command: "call_plugin", payload: { pluginId: "fortune" } }
        // 여기서는 MVP 형태로 runtime에 노출된 인터페이스를 활용하거나, 
        // 나중에는 외부 전용 이벤트를 정의할 수 있습니다.
        // 단순화를 위해 현재는 'external:command' 이벤트를 eventBus로 쏘거나, 
        // runtime.emit을 활용하는 형태를 가정합니다.
        if (data.action && typeof data.action === "string") {
            // 런타임에서 해당 이벤트를 받아 Rule에서 처리할 수 있도록 emit
            // payload에는 외부에서 넘겨준 파라미터 전달
            runtime.emit(data.action, data.payload);
        }
    }
    window.addEventListener("message", handleMessage);
    return {
        destroy: () => {
            window.removeEventListener("message", handleMessage);
        },
    };
}
//# sourceMappingURL=eventBridge.js.map