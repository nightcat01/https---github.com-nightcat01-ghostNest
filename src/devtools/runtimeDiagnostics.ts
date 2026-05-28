import type {
  RuntimeDiagnosticsDevtoolSelectors,
  RuntimeEventName,
  RuntimeState,
  RuntimeTimingOptions,
} from "../core/types.js";

type RuntimeDiagnosticsOptions = {
  selectors?: RuntimeDiagnosticsDevtoolSelectors | undefined;
  state: RuntimeState;
  timing: RuntimeTimingOptions;
  actionTimers: Map<string, number>;
  maxLogItems: number;
  getLayoutMetrics?: () => {
    area: DOMRect;
    speech: DOMRect | null;
  };
};

function optionalElement<TElement extends Element>(selector: string | undefined): TElement | null {
  if (!selector) {
    return null;
  }

  return document.querySelector<TElement>(selector);
}

export function createRuntimeDiagnostics({
  selectors = {},
  state,
  timing,
  actionTimers,
  maxLogItems,
  getLayoutMetrics,
}: RuntimeDiagnosticsOptions) {
  const elements = {
    eventLog: optionalElement<HTMLOListElement>(selectors.eventLog),
    statusMode: optionalElement<HTMLElement>(selectors.statusMode),
    statusExpression: optionalElement<HTMLElement>(selectors.statusExpression),
    statusVisibility: optionalElement<HTMLElement>(selectors.statusVisibility),
    statusLastEvent: optionalElement<HTMLElement>(selectors.statusLastEvent),
    statusIdleCountdown: optionalElement<HTMLElement>(selectors.statusIdleCountdown),
    statusRandomPrompt: optionalElement<HTMLElement>(selectors.statusRandomPrompt),
    statusActionTimers: optionalElement<HTMLElement>(selectors.statusActionTimers),
    statusRuntimeArea: optionalElement<HTMLElement>(selectors.statusRuntimeArea),
    statusSpeechBox: optionalElement<HTMLElement>(selectors.statusSpeechBox),
  };
  let lastEventLabel = "runtime:boot";

  function addLog(label: string) {
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

    if (getLayoutMetrics) {
      const metrics = getLayoutMetrics();

      if (elements.statusRuntimeArea) {
        elements.statusRuntimeArea.textContent = `${Math.round(metrics.area.width)} x ${Math.round(metrics.area.height)}`;
      }

      if (elements.statusSpeechBox) {
        elements.statusSpeechBox.textContent = metrics.speech
          ? `${Math.round(metrics.speech.width)} x ${Math.round(metrics.speech.height)}`
          : "-";
      }
    }
  }

  function setLastEventLabel(eventName: RuntimeEventName) {
    lastEventLabel = eventName;
  }

  return {
    addLog,
    renderStatusPanel,
    setLastEventLabel,
  };
}
