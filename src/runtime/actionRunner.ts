import type {
  DialogueEngine,
  DialogueMessage,
  RuntimeAction,
  RuntimeEventMap,
  RuntimeEventName,
  RuntimePlugin,
  RuntimeState,
  StorageAdapter,
} from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";
import { closeManagementMenu, renderManagementMenu } from "./managementMenu.js";

type RuntimeEventEmitter = {
  emit: <TEventName extends RuntimeEventName>(
    eventName: TEventName,
    payload?: RuntimeEventMap[TEventName],
  ) => void;
};

type ActionRunnerContext = {
  elements: RuntimeElements;
  state: RuntimeState;
  dialogue: DialogueEngine;
  pluginRegistry: Map<string, RuntimePlugin>;
  storageAdapter: StorageAdapter;
  actionTimers: Map<string, number>;
  eventBus: RuntimeEventEmitter;
  renderSpeech: (message: DialogueMessage) => void;
  renderCharacterState: () => void;
  addLog: (label: string) => void;
  touchInteraction: () => void;
};

function getRuntimeUi(target: string) {
  return document.querySelector<HTMLElement>(`[data-runtime-ui="${target}"]`);
}

export function createActionRunner(context: ActionRunnerContext) {
  const {
    elements,
    state,
    dialogue,
    pluginRegistry,
    storageAdapter,
    actionTimers,
    eventBus,
    renderSpeech,
    renderCharacterState,
    addLog,
    touchInteraction,
  } = context;

  async function runAction(action: RuntimeAction) {
    switch (action.type) {
      case "speak":
        renderSpeech(await dialogue.line(action.category));
        return;
      case "speak_text":
        renderSpeech(await dialogue.custom(action.text));
        return;
      case "change_expression":
        state.expression = action.expression;

        if (action.clearTouchedPart) {
          state.lastTouchedPart = null;
        }

        renderCharacterState();
        return;
      case "set_touched_part":
        state.lastTouchedPart = action.part;
        renderCharacterState();
        return;
      case "toggle_hidden":
        state.isHidden = !state.isHidden;
        elements.stage.classList.toggle("is-hidden", state.isHidden);
        return;
      case "call_plugin":
        {
          const plugin = pluginRegistry.get(action.pluginId);

          if (!plugin) {
            renderSpeech(await dialogue.custom(`아직 '${action.pluginId}' 기능은 연결되어 있지 않아요.`));
            return;
          }

          const originalExpression = state.expression;
          state.expression = "thinking";
          renderCharacterState();

          try {
            const result = await plugin.execute();

            if (result.expression) {
              state.expression = result.expression;
            } else {
              state.expression = originalExpression;
            }

            state.lastTouchedPart = null;
            renderCharacterState();
            renderSpeech(await dialogue.custom(`${result.title}. ${result.message}`));
          } catch (err) {
            state.expression = "surprised";
            renderCharacterState();
            renderSpeech(await dialogue.custom(`'${action.pluginId}' 기능 실행 중 문제가 발생했어요.`));
          }
        }
        return;
      case "log":
        addLog(action.label);
        return;
      case "touch_interaction":
        touchInteraction();
        return;
      case "mark_prompted":
        state.lastPromptedAt = Date.now();
        return;
      case "play_animation":
        elements.sprite.dataset.animation = action.animation;

        if (action.duration) {
          window.setTimeout(() => {
            if (elements.sprite.dataset.animation === action.animation) {
              delete elements.sprite.dataset.animation;
            }
          }, action.duration);
        }
        return;
      case "open_ui":
        {
          const targetElement = getRuntimeUi(action.target);
          targetElement?.removeAttribute("hidden");
          elements.stage.dispatchEvent(new CustomEvent("ghostnest:open-ui", { detail: action }));
        }
        return;
      case "close_ui":
        {
          const targetElement = getRuntimeUi(action.target);
          targetElement?.setAttribute("hidden", "");
          elements.stage.dispatchEvent(new CustomEvent("ghostnest:close-ui", { detail: action }));
        }
        return;
      case "navigate":
        window.location.assign(action.route);
        return;
      case "set_state":
        state.mode = action.state;
        elements.stage.dataset.state = action.state;
        return;
      case "emit_event":
        eventBus.emit(action.event, action.payload as never);
        return;
      case "play_sound":
        {
          const audio = new Audio(action.sound);
          audio.volume = action.volume ?? 1;
          void audio.play();
        }
        return;
      case "save_data":
        state.data[action.key] = action.value;
        await storageAdapter.set(action.key, action.value);
        return;
      case "load_data":
        {
          const value = await storageAdapter.get(action.key);
          state.data[action.saveTo ?? action.key] = value;

          if (action.speak) {
            renderSpeech(await dialogue.custom(value === null ? "저장된 값이 아직 없어요." : String(value)));
          }
        }
        return;
      case "show_notification":
        elements.stage.dispatchEvent(new CustomEvent("ghostnest:notification", { detail: action }));

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(action.title, { body: action.message });
          return;
        }

        renderSpeech(await dialogue.custom(`${action.title}. ${action.message}`));
        return;
      case "start_timer":
        {
          const existingTimer = actionTimers.get(action.timer);

          if (existingTimer) {
            window.clearTimeout(existingTimer);
          }

          const timerId = window.setTimeout(() => {
            actionTimers.delete(action.timer);
            void runActions(action.actions);
          }, action.duration);

          actionTimers.set(action.timer, timerId);
        }
        return;
      case "stop_timer":
        {
          const timerId = actionTimers.get(action.timer);

          if (timerId) {
            window.clearTimeout(timerId);
            actionTimers.delete(action.timer);
          }
        }
        return;
      case "move_character":
        elements.stage.style.setProperty("--character-stage-x", `${action.x}px`);
        elements.stage.style.setProperty("--character-stage-y", `${action.y}px`);
        elements.stage.dataset.positionMode = "custom";
        return;
      case "change_balloon":
        if (action.theme === "default") {
          delete elements.stage.dataset.balloonTheme;
          return;
        }

        elements.stage.dataset.balloonTheme = action.theme;
        return;
      case "open_management_menu":
        renderManagementMenu({
          action,
          menuElement: elements.balloonActionMenu,
          runActions,
        });
        return;
      case "close_management_menu":
        closeManagementMenu(elements.balloonActionMenu);
        return;
    }
  }

  async function runActions(actions: RuntimeAction[]) {
    for (const action of actions) {
      await runAction(action);
    }
  }

  return {
    runAction,
    runActions,
  };
}
