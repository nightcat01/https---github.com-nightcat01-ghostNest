function optionalElement(selector) {
    if (!selector) {
        return null;
    }
    return document.querySelector(selector);
}
export function createRuntimeDiagnostics({ selectors = {}, state, timing, actionTimers, maxLogItems, }) {
    const elements = {
        eventLog: optionalElement(selectors.eventLog),
        statusMode: optionalElement(selectors.statusMode),
        statusExpression: optionalElement(selectors.statusExpression),
        statusVisibility: optionalElement(selectors.statusVisibility),
        statusLastEvent: optionalElement(selectors.statusLastEvent),
        statusIdleCountdown: optionalElement(selectors.statusIdleCountdown),
        statusRandomPrompt: optionalElement(selectors.statusRandomPrompt),
        statusActionTimers: optionalElement(selectors.statusActionTimers),
    };
    let lastEventLabel = "runtime:boot";
    function addLog(label) {
        if (!elements.eventLog) {
            return;
        }
        const item = document.createElement("li");
        const time = new Intl.DateTimeFormat("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date());
        item.textContent = `${time} · ${label}`;
        elements.eventLog.prepend(item);
        while (elements.eventLog.children.length > maxLogItems) {
            elements.eventLog.lastElementChild?.remove();
        }
    }
    function renderStatusPanel() {
        const now = Date.now();
        const idleRemaining = Math.max(0, timing.idleDelay - (now - state.lastInteractionAt));
        const randomIdleRemaining = Math.max(0, timing.randomPromptDelay - (now - state.lastInteractionAt));
        const randomCooldownRemaining = Math.max(0, timing.randomPromptCooldown - (now - state.lastPromptedAt));
        const randomReady = randomIdleRemaining === 0 && randomCooldownRemaining === 0;
        if (elements.statusMode) {
            elements.statusMode.textContent = state.mode;
        }
        if (elements.statusExpression) {
            elements.statusExpression.textContent = state.expression;
        }
        if (elements.statusVisibility) {
            elements.statusVisibility.textContent = state.isHidden ? "숨김" : "표시 중";
        }
        if (elements.statusLastEvent) {
            elements.statusLastEvent.textContent = lastEventLabel;
        }
        if (elements.statusIdleCountdown) {
            elements.statusIdleCountdown.textContent = `${Math.ceil(idleRemaining / 1000)}초`;
        }
        if (elements.statusRandomPrompt) {
            elements.statusRandomPrompt.textContent = randomReady
                ? `대기 중 (${Math.round(timing.randomPromptChance * 100)}%)`
                : `조건 대기 ${Math.ceil(Math.max(randomIdleRemaining, randomCooldownRemaining) / 1000)}초`;
        }
        if (elements.statusActionTimers) {
            elements.statusActionTimers.textContent = `${actionTimers.size}개`;
        }
    }
    function setLastEventLabel(eventName) {
        lastEventLabel = eventName;
    }
    return {
        addLog,
        renderStatusPanel,
        setLastEventLabel,
    };
}
//# sourceMappingURL=runtimeDiagnostics.js.map