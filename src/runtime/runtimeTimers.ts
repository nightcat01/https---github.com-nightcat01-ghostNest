import type { RuntimeEventMap, RuntimeEventName, RuntimeState, RuntimeTimingOptions } from "../core/types.js";

type RuntimeEventEmitter = {
  emit: <TEventName extends RuntimeEventName>(
    eventName: TEventName,
    payload?: RuntimeEventMap[TEventName],
  ) => void;
};

type StartRuntimeTimersOptions = {
  eventBus: RuntimeEventEmitter;
  state: RuntimeState;
  timing: RuntimeTimingOptions;
  renderStatusPanel: () => void;
  touchInteraction: () => void;
};

export function startRuntimeTimers({
  eventBus,
  state,
  timing,
  renderStatusPanel,
  touchInteraction,
}: StartRuntimeTimersOptions) {
  const idleTimer = window.setInterval(() => {
    if (state.isHidden) {
      return;
    }

    const idleTime = Date.now() - state.lastInteractionAt;

    if (idleTime >= timing.idleDelay) {
      touchInteraction();
      eventBus.emit("character:idle");
    }
  }, 1000);

  const statusTimer = window.setInterval(() => {
    renderStatusPanel();
  }, 1000);

  const randomPromptTimer = window.setInterval(() => {
    if (state.isHidden) {
      return;
    }

    const now = Date.now();
    const idleTime = now - state.lastInteractionAt;
    const promptCooldown = now - state.lastPromptedAt;

    if (
      idleTime >= timing.randomPromptDelay &&
      promptCooldown >= timing.randomPromptCooldown &&
      Math.random() < timing.randomPromptChance
    ) {
      eventBus.emit("character:randomPrompt");
    }
  }, 3000);

  return () => {
    window.clearInterval(idleTimer);
    window.clearInterval(statusTimer);
    window.clearInterval(randomPromptTimer);
  };
}
