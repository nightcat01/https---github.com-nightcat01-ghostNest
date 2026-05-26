import { createDialogueEngine } from "../core/dialogueEngine.js";
import { validateDialogueScript } from "../core/dialogueScriptValidator.js";
import { createEventBus } from "../core/eventBus.js";
import { createRuntimeState } from "../core/runtimeState.js";
import { createLocalStorageAdapter } from "../core/storageAdapter.js";
import { createExternalEventBridge } from "../core/eventBridge.js";
import { createRuntimeDiagnostics } from "../devtools/runtimeDiagnostics.js";
import { createActionRunner } from "./actionRunner.js";
import { createCharacterRenderer } from "./characterRenderer.js";
import { createDefaultRules } from "./defaultRules.js";
import { createDialoguePlayer } from "./dialoguePlayer.js";
import { getRuntimeElements } from "./domElements.js";
import { initFloatingLayout } from "./floatingLayout.js";
import { initHitboxEditor } from "../devtools/hitboxEditor.js";
import { bindRuntimeDomEvents } from "./runtimeEventBindings.js";
import { startRuntimeTimers } from "./runtimeTimers.js";
import { bindRuntimeRuleEvents } from "./ruleRunner.js";
import {
  defaultFeatures,
  defaultMaxLogItems,
  defaultSpriteSize,
  defaultTiming,
  defaultTyping,
} from "./runtimeDefaults.js";
import type {
  CharacterExpression,
  DialogueChoice,
  DialogueMessage,
  GhostRuntime,
  GhostRuntimeOptions,
  RuntimeEventName,
} from "../core/types.js";

/**
 * 캐릭터 데이터, 플러그인, DOM selector를 받아 웹 캐릭터 런타임을 생성합니다.
 */
export function createGhostRuntime(options: GhostRuntimeOptions): GhostRuntime {
  const timing = {
    ...defaultTiming,
    ...options.timing,
  };
  const features = {
    ...defaultFeatures,
    ...options.features,
  };
  const spriteSize = {
    ...defaultSpriteSize,
    ...options.spriteSize,
  };
  const typing = {
    ...defaultTyping,
    ...options.typing,
  };
  const maxLogItems = options.maxLogItems ?? defaultMaxLogItems;
  const elements = getRuntimeElements(options.selectors);
  const eventBus = createEventBus();
  const pluginRegistry = new Map(options.plugins?.map((plugin) => [plugin.id, plugin]) ?? []);
  const rules = [...createDefaultRules(timing), ...(options.rules ?? [])];
  
  const storageAdapter = options.storageAdapter ?? createLocalStorageAdapter(`ghostNest:${options.character.profile.id}`);
  const dialogue = options.dialogueEngine ?? createDialogueEngine({
    profile: options.character.profile,
    lines: options.character.lines,
  });
  
  const state = createRuntimeState();
  const cleanupCallbacks: Array<() => void> = [];
  const actionTimers = new Map<string, number>();
  const ruleCooldowns = new Map<string, number>();
  const characterRenderer = createCharacterRenderer({ elements, character: options.character });
  const diagnostics = createRuntimeDiagnostics({
    selectors: options.devtools?.diagnostics?.selectors,
    state,
    timing,
    actionTimers,
    maxLogItems,
  });
  const dialoguePlayer = createDialoguePlayer({
    typingInterval: typing.enabled ? typing.interval : 0,
    onText(text) {
      elements.speechText.textContent += text;
    },
    onClear() {
      elements.speechText.textContent = "";
    },
    onSurface(id) {
      elements.stage.dispatchEvent(new CustomEvent("ghostnest:surface-change", { detail: { id } }));
    },
    onChoice(choices) {
      renderDialogueChoices(choices);
    },
    onMouth(isActive) {
      characterRenderer.setMouthAnimationActive(isActive);
    },
    onEnd() {
      characterRenderer.setMouthAnimationActive(false);
      state.mode = "idle";
      characterRenderer.setMode(state.mode);
      diagnostics.renderStatusPanel();
    },
    onStop() {
      characterRenderer.setMouthAnimationActive(false);
      state.mode = "idle";
      characterRenderer.setMode(state.mode);
      diagnostics.renderStatusPanel();
    },
  });

  elements.stage.style.setProperty("--character-sprite-width", spriteSize.desktopWidth);
  elements.stage.style.setProperty("--character-sprite-height", spriteSize.desktopHeight);
  elements.stage.style.setProperty("--character-sprite-mobile-width", spriteSize.mobileWidth);
  elements.stage.style.setProperty("--character-sprite-mobile-height", spriteSize.mobileHeight);
  cleanupCallbacks.push(initFloatingLayout({ elements }));

  /**
   * 현재 대화 메시지를 말풍선 DOM에 반영합니다.
   */
  function clearDialogueChoices() {
    elements.balloonActionMenu?.replaceChildren();

    if (elements.balloonActionMenu) {
      elements.balloonActionMenu.hidden = true;
      delete elements.balloonActionMenu.dataset.managementMenuDisplay;
    }
  }

  function renderDialogueChoices(choices: DialogueChoice[]) {
    const menuElement = elements.balloonActionMenu;

    if (!menuElement) {
      return;
    }

    menuElement.replaceChildren();
    menuElement.dataset.managementMenuDisplay = "choice";

    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.dataset.dialogueChoice = String(index);
      button.addEventListener("click", () => {
        clearDialogueChoices();
        void runActions(choice.actions);
      });
      menuElement.append(button);
    });

    menuElement.hidden = false;
  }

  function renderSpeech(message: DialogueMessage) {
    elements.speakerName.textContent = message.speaker;

    dialoguePlayer.stop();
    clearDialogueChoices();
    elements.speechText.textContent = "";

    const script = message.script ?? [
      { type: "text" as const, value: message.text },
      { type: "end" as const },
    ];
    const validation = validateDialogueScript(script, {
      knownSurfaceIds: Object.keys(options.character.assets?.surfaces ?? {}),
    });

    if (!validation.valid) {
      console.warn("[GhostNest] Invalid DialogueScript. Falling back to plain text.", validation.errors);
      void dialoguePlayer.play([
        { type: "text", value: message.text },
        { type: "end" },
      ]);
      return;
    }

    if (validation.warnings.length > 0) {
      console.warn("[GhostNest] DialogueScript warnings.", validation.warnings);
    }

    state.mode = "talking";
    elements.stage.dataset.state = state.mode;
    void dialoguePlayer.play(validation.script);
  }

  function renderPreviewSpeech(message: DialogueMessage) {
    elements.speakerName.textContent = message.speaker;
    dialoguePlayer.stop();
    elements.speechText.textContent = message.text;
    characterRenderer.setMouthAnimationActive(false);
  }

  /**
   * 런타임 상태를 sprite dataset에 반영해 CSS 표정/포즈를 전환합니다.
   */
  function renderCharacterState() {
    characterRenderer.renderState(state);
  }

  /**
   * 마지막 터치 부위를 지우고 지정한 기본 표정으로 되돌립니다.
   */
  function resetCharacterPose(expression: CharacterExpression = "neutral") {
    state.expression = expression;
    state.lastTouchedPart = null;
    renderCharacterState();
  }

  /**
   * 사용자 상호작용 시각을 갱신해 idle/random prompt 타이머를 조절합니다.
   */
  function touchInteraction() {
    state.lastInteractionAt = Date.now();
  }

  const { runAction, runActions, registerAction } = createActionRunner({
    elements,
    state,
    dialogue,
    pluginRegistry,
    storageAdapter,
    actionTimers,
    managementMenu: options.managementMenu,
    eventBus,
    renderSpeech,
    renderPreviewSpeech,
    renderCharacterState,
    applySurface: characterRenderer.applySurface,
    setLayerAnimationActive: characterRenderer.setLayerAnimationActive,
    addLog: diagnostics.addLog,
    touchInteraction,
  });

  bindRuntimeRuleEvents({
    eventBus,
    rules,
    features,
    state,
    ruleCooldowns,
    runActions,
    setLastEventLabel: diagnostics.setLastEventLabel,
  });

  eventBus.on("command:hide", async () => {
    touchInteraction();
    state.isHidden = !state.isHidden;
    elements.stage.classList.toggle("is-hidden", state.isHidden);
    
    if (elements.restoreBadge) {
      elements.restoreBadge.hidden = !state.isHidden;
    }

    if (state.isHidden) {
      renderSpeech(await dialogue.line("onHide"));
      diagnostics.addLog("character:hide");
      return;
    }

    renderSpeech(await dialogue.line("onShow"));
    diagnostics.addLog("character:show");
  });

  bindRuntimeDomEvents({
    elements,
    eventBus,
    character: options.character,
    cleanupCallbacks,
    touchInteraction,
    runAction,
    shouldSkipDialogue: dialoguePlayer.getIsPlaying,
    skipDialogue: dialoguePlayer.skip,
  });

  const handleSurfaceChange = (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string }>).detail;

    if (detail?.id) {
      characterRenderer.applySurface(detail.id);
    }
  };

  elements.stage.addEventListener("ghostnest:surface-change", handleSurfaceChange);
  cleanupCallbacks.push(() => {
    elements.stage.removeEventListener("ghostnest:surface-change", handleSurfaceChange);
  });

  cleanupCallbacks.push(startRuntimeTimers({
    eventBus,
    state,
    timing,
    renderStatusPanel: diagnostics.renderStatusPanel,
    touchInteraction,
  }));

  cleanupCallbacks.push(() => {
    dialoguePlayer.stop();
    characterRenderer.destroy();

    actionTimers.forEach((timerId) => window.clearTimeout(timerId));
    actionTimers.clear();
  });

  if (options.devtools?.hitboxEditor) {
    const hitboxEditor = initHitboxEditor({
      elements,
      character: options.character,
      selectors: options.devtools.hitboxEditor.selectors,
      storageAdapter,
    });
    cleanupCallbacks.push(hitboxEditor.destroy);
  }
  renderCharacterState();
  diagnostics.renderStatusPanel();
  eventBus.emit("runtime:ready");

  let isDestroyed = false;
  
  const runtime: GhostRuntime = {
    emit(eventName, payload) {
      if (isDestroyed) {
        return;
      }

      eventBus.emit(eventName, payload);
    },
    registerAction,
    destroy() {
      if (isDestroyed) {
        return;
      }

      isDestroyed = true;
      cleanupCallbacks.forEach((cleanup) => cleanup());
    },
  };

  const eventBridge = createExternalEventBridge(runtime);
  cleanupCallbacks.push(() => eventBridge.destroy());

  return runtime;
}
