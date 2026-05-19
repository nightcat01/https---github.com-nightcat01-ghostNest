import { createDialogueEngine } from "../core/dialogueEngine.js";
import { createEventBus } from "../core/eventBus.js";
import { createRuntimeState } from "../core/runtimeState.js";
import { createLocalStorageAdapter } from "../core/storageAdapter.js";
import { createExternalEventBridge } from "../core/eventBridge.js";
import { createActionRunner } from "./actionRunner.js";
import { createDefaultRules } from "./defaultRules.js";
import { getRuntimeElements } from "./domElements.js";
import { initHitboxEditor } from "./hitboxEditor.js";
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
  DialogueMessage,
  GhostRuntime,
  GhostRuntimeOptions,
  RuntimeEventName,
} from "../core/types.js";

/**
 * 표정 asset 후보가 여러 개일 때 직전 이미지와 가능한 한 다른 이미지를 고릅니다.
 */
function pickExpressionAsset(asset: string | string[], currentAsset: string | null) {
  if (typeof asset === "string") {
    return asset;
  }

  if (asset.length === 0) {
    return null;
  }

  const candidates = asset.length > 1 ? asset.filter((candidate) => candidate !== currentAsset) : asset;
  const index = Math.floor(Math.random() * candidates.length);

  return candidates[index] ?? asset[0] ?? null;
}

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
  let speechTypingTimer: number | null = null;
  let speechTypingToken = 0;
  let lastEventLabel = "runtime:boot";

  elements.stage.style.setProperty("--character-sprite-width", spriteSize.desktopWidth);
  elements.stage.style.setProperty("--character-sprite-height", spriteSize.desktopHeight);
  elements.stage.style.setProperty("--character-sprite-mobile-width", spriteSize.mobileWidth);
  elements.stage.style.setProperty("--character-sprite-mobile-height", spriteSize.mobileHeight);

  /**
   * 현재 대화 메시지를 말풍선 DOM에 반영합니다.
   */
  function renderSpeech(message: DialogueMessage) {
    elements.speakerName.textContent = message.speaker;

    if (speechTypingTimer !== null) {
      window.clearTimeout(speechTypingTimer);
      speechTypingTimer = null;
    }

    speechTypingToken += 1;

    if (!typing.enabled || typing.interval <= 0) {
      elements.speechText.textContent = message.text;
      return;
    }

    const token = speechTypingToken;
    const characters = Array.from(message.text);
    let index = 1;
    elements.speechText.textContent = "";

    const typeNext = () => {
      if (token !== speechTypingToken) {
        return;
      }

      elements.speechText.textContent = characters.slice(0, index).join("");

      if (index > characters.length) {
        speechTypingTimer = null;
        return;
      }

      index += 1;
      speechTypingTimer = window.setTimeout(typeNext, typing.interval);
    };

    typeNext();
  }

  /**
   * 런타임 상태를 sprite dataset에 반영해 CSS 표정/포즈를 전환합니다.
   */
  function renderCharacterState() {
    elements.sprite.dataset.expression = state.expression;
    elements.spriteImage.alt = options.character.assets?.alt ?? options.character.profile.name;

    const expressionAsset = options.character.assets
      ? pickExpressionAsset(options.character.assets.expressions[state.expression], elements.spriteImage.getAttribute("src"))
      : null;

    if (expressionAsset && elements.spriteImage.getAttribute("src") !== expressionAsset) {
      elements.spriteImage.src = expressionAsset;
    }

    if (state.lastTouchedPart) {
      elements.sprite.dataset.touchedPart = state.lastTouchedPart;
      return;
    }

    delete elements.sprite.dataset.touchedPart;
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
   * 데모 화면의 이벤트 로그에 최근 런타임 이벤트를 추가합니다.
   */
  function addLog(label: string) {
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

  /**
   * 테스트 화면의 런타임 상태 패널을 갱신합니다.
   */
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

  /**
   * 사용자 상호작용 시각을 갱신해 idle/random prompt 타이머를 조절합니다.
   */
  function touchInteraction() {
    state.lastInteractionAt = Date.now();
  }

  const { runAction, runActions } = createActionRunner({
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
  });

  bindRuntimeRuleEvents({
    eventBus,
    rules,
    features,
    state,
    ruleCooldowns,
    runActions,
    setLastEventLabel: (eventName: RuntimeEventName) => {
      lastEventLabel = eventName;
    },
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
      addLog("character:hide");
      return;
    }

    renderSpeech(await dialogue.line("onShow"));
    addLog("character:show");
  });

  bindRuntimeDomEvents({
    elements,
    eventBus,
    character: options.character,
    cleanupCallbacks,
    touchInteraction,
    runAction,
  });

  cleanupCallbacks.push(startRuntimeTimers({
    eventBus,
    state,
    timing,
    renderStatusPanel,
    touchInteraction,
  }));

  cleanupCallbacks.push(() => {
    speechTypingToken += 1;

    if (speechTypingTimer !== null) {
      window.clearTimeout(speechTypingTimer);
    }

    actionTimers.forEach((timerId) => window.clearTimeout(timerId));
    actionTimers.clear();
  });

  initHitboxEditor({ elements, character: options.character });
  renderCharacterState();
  renderStatusPanel();
  eventBus.emit("runtime:ready");

  let isDestroyed = false;
  
  const runtime: GhostRuntime = {
    emit(eventName, payload) {
      if (isDestroyed) {
        return;
      }

      eventBus.emit(eventName, payload);
    },
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
