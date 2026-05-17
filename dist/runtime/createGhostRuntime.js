import { createDialogueEngine } from "../core/dialogueEngine.js";
import { createEventBus } from "../core/eventBus.js";
import { getCharacterTouchPart } from "../core/hitTest.js";
import { createRuntimeState } from "../core/runtimeState.js";
const defaultTiming = {
    idleDelay: 18000,
    randomPromptDelay: 14000,
    randomPromptCooldown: 22000,
    randomPromptChance: 0.18,
    areaHoverCooldown: 5000,
};
const defaultMaxLogItems = 8;
const defaultFeatures = {
    commandHoverDescription: true,
};
const defaultSpriteSize = {
    desktopWidth: "220px",
    desktopHeight: "330px",
    mobileWidth: "154px",
    mobileHeight: "232px",
};
const defaultTyping = {
    enabled: true,
    interval: 28,
};
const interactiveAreaIds = ["runtimeTitle", "eventLog", "commandMenu"];
const commandIds = ["fortune", "line", "hide"];
const touchPartConfig = {
    head: {
        expression: "happy",
        dialogueCategory: "onTouchHead",
        logLabel: "character:touch.head",
    },
    face: {
        expression: "surprised",
        dialogueCategory: "onTouchFace",
        logLabel: "character:touch.face",
    },
    body: {
        expression: "thinking",
        dialogueCategory: "onTouchBody",
        logLabel: "character:touch.body",
    },
};
const areaHoverConfig = {
    runtimeTitle: {
        dialogueCategory: "onHoverRuntimeTitle",
        logLabel: "area:hover.runtimeTitle",
    },
    eventLog: {
        dialogueCategory: "onHoverEventLog",
        logLabel: "area:hover.eventLog",
    },
    commandMenu: {
        dialogueCategory: "onHoverCommandMenu",
        logLabel: "area:hover.commandMenu",
    },
};
const commandHoverConfig = {
    fortune: {
        dialogueCategory: "onHoverFortuneCommand",
        logLabel: "command:hover.fortune",
    },
    line: {
        dialogueCategory: "onHoverLineCommand",
        logLabel: "command:hover.line",
    },
    hide: {
        dialogueCategory: "onHoverHideCommand",
        logLabel: "command:hover.hide",
    },
};
/**
 * 현재 MVP에서 기본으로 제공하는 이벤트-액션 규칙을 생성합니다.
 */
function createDefaultRules(timing) {
    return [
        {
            id: "runtime.ready",
            event: "runtime:ready",
            actions: [
                { type: "speak", category: "onMount" },
                { type: "log", label: "runtime:ready" },
            ],
        },
        {
            id: "character.click",
            event: "character:click",
            actions: [
                { type: "touch_interaction" },
                { type: "speak", category: "onClick" },
                { type: "log", label: "character:click" },
            ],
        },
        {
            id: "character.double_click.management_menu",
            event: "character:double_click",
            actions: [
                { type: "touch_interaction" },
                { type: "change_expression", expression: "thinking", clearTouchedPart: true },
                { type: "speak_text", text: "관리 메뉴를 열었어요. 필요한 동작을 골라주세요." },
                {
                    type: "open_management_menu",
                    title: "관리 메뉴",
                    items: [
                        {
                            id: "say-line",
                            label: "한마디",
                            actions: [
                                { type: "speak", category: "onLine" },
                                { type: "log", label: "management.say_line" },
                            ],
                        },
                        {
                            id: "draw-fortune",
                            label: "운세 실행",
                            actions: [
                                { type: "call_plugin", pluginId: "fortune" },
                                { type: "log", label: "management.draw_fortune" },
                            ],
                        },
                        {
                            id: "balloon-theme",
                            label: "말풍선 테마",
                            children: [
                                {
                                    id: "balloon-default",
                                    label: "기본",
                                    actions: [
                                        { type: "change_balloon", theme: "default" },
                                        { type: "speak_text", text: "말풍선을 기본 분위기로 돌려놓았어요." },
                                        { type: "log", label: "management.balloon.default" },
                                    ],
                                },
                                {
                                    id: "balloon-soft",
                                    label: "soft",
                                    actions: [
                                        { type: "change_balloon", theme: "soft" },
                                        { type: "speak_text", text: "말풍선 분위기를 조금 부드럽게 바꿨어요." },
                                        { type: "log", label: "management.balloon.soft" },
                                    ],
                                },
                                {
                                    id: "balloon-dark-magic",
                                    label: "dark magic",
                                    actions: [
                                        { type: "change_balloon", theme: "dark_magic" },
                                        { type: "speak_text", text: "조금 더 마법서 같은 분위기로 바꿨어요." },
                                        { type: "log", label: "management.balloon.dark_magic" },
                                    ],
                                },
                            ],
                        },
                        {
                            id: "jump",
                            label: "점프",
                            actions: [
                                { type: "play_animation", animation: "jump", duration: 460 },
                                { type: "speak_text", text: "자, 가볍게 뛰어볼게요!" },
                                { type: "log", label: "management.animation.jump" },
                            ],
                        },
                        {
                            id: "hide",
                            label: "숨기기",
                            actions: [
                                { type: "toggle_hidden" },
                                { type: "speak", category: "onHide" },
                                { type: "log", label: "management.hide" },
                            ],
                        },
                    ],
                },
                { type: "log", label: "character:double_click.management_menu" },
            ],
        },
        ...Object.entries(touchPartConfig).map(([part, config]) => ({
            id: `character.touch.${part}`,
            event: "character:touch",
            when: { part: part },
            actions: [
                { type: "touch_interaction" },
                { type: "change_expression", expression: config.expression },
                { type: "set_touched_part", part: part },
                { type: "speak", category: config.dialogueCategory },
                { type: "log", label: config.logLabel },
            ],
        })),
        {
            id: "character.idle",
            event: "character:idle",
            actions: [
                { type: "change_expression", expression: "neutral", clearTouchedPart: true },
                { type: "speak", category: "onIdle" },
                { type: "log", label: "character:idle" },
            ],
        },
        ...Object.entries(areaHoverConfig).map(([area, config]) => ({
            id: `area.hover.${area}`,
            event: "area:hover",
            when: { area: area },
            conditions: [{ type: "cooldown", key: `area:hover:${area}`, duration: timing.areaHoverCooldown }],
            actions: [
                { type: "touch_interaction" },
                { type: "change_expression", expression: "thinking", clearTouchedPart: true },
                { type: "speak", category: config.dialogueCategory },
                { type: "log", label: config.logLabel },
            ],
        })),
        ...Object.entries(commandHoverConfig).map(([command, config]) => ({
            id: `command.hover.${command}`,
            event: "command:hover",
            when: { command: command },
            conditions: [{ type: "feature_enabled", feature: "commandHoverDescription" }],
            actions: [
                { type: "touch_interaction" },
                { type: "change_expression", expression: "thinking", clearTouchedPart: true },
                { type: "speak", category: config.dialogueCategory },
                { type: "log", label: config.logLabel },
            ],
        })),
        {
            id: "character.random_prompt",
            event: "character:randomPrompt",
            actions: [
                { type: "touch_interaction" },
                { type: "mark_prompted" },
                { type: "change_expression", expression: "happy", clearTouchedPart: true },
                { type: "speak", category: "onRandomPrompt" },
                { type: "log", label: "character:randomPrompt" },
            ],
        },
        {
            id: "command.line",
            event: "command:line",
            actions: [
                { type: "touch_interaction" },
                { type: "speak", category: "onLine" },
                { type: "log", label: "command:line" },
            ],
        },
        {
            id: "command.fortune",
            event: "command:fortune",
            actions: [
                { type: "touch_interaction" },
                { type: "call_plugin", pluginId: "fortune" },
                { type: "log", label: "plugin:fortune.execute" },
            ],
        },
    ];
}
/**
 * 런타임이 반드시 필요로 하는 DOM 요소를 찾아 반환합니다.
 */
function requiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Required element is missing: ${selector}`);
    }
    return element;
}
/**
 * 선택 요소가 없을 수도 있는 진단 UI를 안전하게 조회합니다.
 */
function optionalElement(selector) {
    if (!selector) {
        return null;
    }
    return document.querySelector(selector);
}
/**
 * DOM dataset 값이 런타임에서 지원하는 관찰 영역 ID인지 확인합니다.
 */
function isInteractiveAreaId(value) {
    return interactiveAreaIds.some((areaId) => areaId === value);
}
/**
 * DOM dataset 값이 런타임에서 지원하는 명령 버튼 ID인지 확인합니다.
 */
function isRuntimeCommandId(value) {
    return commandIds.some((commandId) => commandId === value);
}
/**
 * 표정 asset 후보가 여러 개일 때 직전 이미지와 가능한 한 다른 이미지를 고릅니다.
 */
function pickExpressionAsset(asset, currentAsset) {
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
export function createGhostRuntime(options) {
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
    const elements = {
        stage: requiredElement(options.selectors.stage),
        sprite: requiredElement(options.selectors.sprite),
        spriteImage: requiredElement(options.selectors.spriteImage),
        speakerName: requiredElement(options.selectors.speakerName),
        speechText: requiredElement(options.selectors.speechText),
        balloonActionMenu: optionalElement(options.selectors.balloonActionMenu),
        eventLog: requiredElement(options.selectors.eventLog),
        menuButtons: document.querySelectorAll(options.selectors.menuButtons),
        observeAreas: document.querySelectorAll(options.selectors.observeAreas),
        statusMode: optionalElement(options.selectors.statusMode),
        statusExpression: optionalElement(options.selectors.statusExpression),
        statusVisibility: optionalElement(options.selectors.statusVisibility),
        statusLastEvent: optionalElement(options.selectors.statusLastEvent),
        statusIdleCountdown: optionalElement(options.selectors.statusIdleCountdown),
        statusRandomPrompt: optionalElement(options.selectors.statusRandomPrompt),
        statusActionTimers: optionalElement(options.selectors.statusActionTimers),
    };
    const eventBus = createEventBus();
    const pluginRegistry = new Map(options.plugins?.map((plugin) => [plugin.id, plugin]) ?? []);
    const rules = [...createDefaultRules(timing), ...(options.rules ?? [])];
    const dialogue = createDialogueEngine({
        profile: options.character.profile,
        lines: options.character.lines,
    });
    const state = createRuntimeState();
    const cleanupCallbacks = [];
    const actionTimers = new Map();
    const ruleCooldowns = new Map();
    let speechTypingTimer = null;
    let speechTypingToken = 0;
    let lastEventLabel = "runtime:boot";
    elements.stage.style.setProperty("--character-sprite-width", spriteSize.desktopWidth);
    elements.stage.style.setProperty("--character-sprite-height", spriteSize.desktopHeight);
    elements.stage.style.setProperty("--character-sprite-mobile-width", spriteSize.mobileWidth);
    elements.stage.style.setProperty("--character-sprite-mobile-height", spriteSize.mobileHeight);
    /**
     * 현재 대화 메시지를 말풍선 DOM에 반영합니다.
     */
    function renderSpeech(message) {
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
    function resetCharacterPose(expression = "neutral") {
        state.expression = expression;
        state.lastTouchedPart = null;
        renderCharacterState();
    }
    /**
     * 데모 화면의 이벤트 로그에 최근 런타임 이벤트를 추가합니다.
     */
    function addLog(label) {
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
    /**
     * target ID로 등록된 런타임 UI 요소를 찾습니다.
     */
    function getRuntimeUi(target) {
        return document.querySelector(`[data-runtime-ui="${target}"]`);
    }
    /**
     * localStorage에 저장할 때 쓰는 런타임 전용 키를 만듭니다.
     */
    function getStorageKey(key) {
        return `ghostNest:${options.character.profile.id}:${key}`;
    }
    /**
     * 말풍선 내부에 관리 메뉴 버튼을 렌더링합니다.
     */
    function renderManagementMenu(action, currentItems = action.items, parentItems, menuTitle = action.title) {
        if (!elements.balloonActionMenu) {
            return;
        }
        elements.balloonActionMenu.replaceChildren();
        if (menuTitle) {
            const titleElement = document.createElement("strong");
            titleElement.textContent = menuTitle;
            elements.balloonActionMenu.append(titleElement);
        }
        if (parentItems) {
            const backButton = document.createElement("button");
            backButton.type = "button";
            backButton.textContent = "← 뒤로";
            backButton.dataset.managementAction = "back";
            backButton.addEventListener("click", () => {
                renderManagementMenu(action, parentItems, undefined, action.title);
            });
            elements.balloonActionMenu.append(backButton);
        }
        currentItems.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = item.label;
            button.dataset.managementAction = item.id;
            button.addEventListener("click", () => {
                if (item.children) {
                    renderManagementMenu(action, item.children, currentItems, item.label);
                    return;
                }
                runActions([...(item.actions ?? []), { type: "close_management_menu" }]);
            });
            elements.balloonActionMenu?.append(button);
        });
        elements.balloonActionMenu.hidden = false;
    }
    /**
     * 데이터화된 런타임 액션을 실제 UI/상태 변경으로 실행합니다.
     */
    function runAction(action) {
        switch (action.type) {
            case "speak":
                renderSpeech(dialogue.line(action.category));
                return;
            case "speak_text":
                renderSpeech(dialogue.custom(action.text));
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
                        renderSpeech(dialogue.custom(`아직 '${action.pluginId}' 기능은 연결되어 있지 않아요.`));
                        return;
                    }
                    const result = plugin.execute();
                    if (result.expression) {
                        state.expression = result.expression;
                        state.lastTouchedPart = null;
                        renderCharacterState();
                    }
                    renderSpeech(dialogue.custom(`${result.title}. ${result.message}`));
                    return;
                }
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
                eventBus.emit(action.event, action.payload);
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
                window.localStorage.setItem(getStorageKey(action.key), JSON.stringify(action.value));
                return;
            case "load_data":
                {
                    const rawValue = window.localStorage.getItem(getStorageKey(action.key));
                    const value = rawValue ? JSON.parse(rawValue) : null;
                    state.data[action.saveTo ?? action.key] = value;
                    if (action.speak) {
                        renderSpeech(dialogue.custom(value === null ? "저장된 값이 아직 없어요." : String(value)));
                    }
                }
                return;
            case "show_notification":
                elements.stage.dispatchEvent(new CustomEvent("ghostnest:notification", { detail: action }));
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(action.title, { body: action.message });
                    return;
                }
                renderSpeech(dialogue.custom(`${action.title}. ${action.message}`));
                return;
            case "start_timer":
                {
                    const existingTimer = actionTimers.get(action.timer);
                    if (existingTimer) {
                        window.clearTimeout(existingTimer);
                    }
                    const timerId = window.setTimeout(() => {
                        actionTimers.delete(action.timer);
                        runActions(action.actions);
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
                renderManagementMenu(action);
                return;
            case "close_management_menu":
                if (elements.balloonActionMenu) {
                    elements.balloonActionMenu.hidden = true;
                    elements.balloonActionMenu.replaceChildren();
                }
                return;
        }
    }
    /**
     * 여러 런타임 액션을 순서대로 실행합니다.
     */
    function runActions(actions) {
        actions.forEach((action) => runAction(action));
    }
    /**
     * 이벤트 payload가 rule의 when 조건과 일치하는지 확인합니다.
     */
    function matchesRuleWhen(rule, payload) {
        if (!rule.when) {
            return true;
        }
        return Object.entries(rule.when).every(([key, value]) => {
            return payload[key] === value;
        });
    }
    /**
     * rule 조건을 검사하고 쿨다운 조건은 통과 시점을 기록합니다.
     */
    function passesConditions(conditions = []) {
        const now = Date.now();
        const passedCooldowns = [];
        for (const condition of conditions) {
            switch (condition.type) {
                case "feature_enabled":
                    if (!features[condition.feature]) {
                        return false;
                    }
                    break;
                case "not_hidden":
                    if (state.isHidden) {
                        return false;
                    }
                    break;
                case "mode_is":
                    if (state.mode !== condition.state) {
                        return false;
                    }
                    break;
                case "cooldown":
                    if (now - (ruleCooldowns.get(condition.key) ?? 0) < condition.duration) {
                        return false;
                    }
                    passedCooldowns.push({ key: condition.key, time: now });
                    break;
            }
        }
        passedCooldowns.forEach(({ key, time }) => ruleCooldowns.set(key, time));
        return true;
    }
    /**
     * 이벤트 이름과 payload에 맞는 rule을 찾아 액션을 실행합니다.
     */
    function runRules(eventName, payload) {
        lastEventLabel = eventName;
        rules
            .filter((rule) => rule.event === eventName)
            .filter((rule) => matchesRuleWhen(rule, payload))
            .filter((rule) => passesConditions(rule.conditions))
            .forEach((rule) => runActions(rule.actions));
    }
    eventBus.on("runtime:ready", (payload) => runRules("runtime:ready", payload));
    eventBus.on("character:click", (payload) => runRules("character:click", payload));
    eventBus.on("character:double_click", (payload) => runRules("character:double_click", payload));
    eventBus.on("character:touch", (payload) => runRules("character:touch", payload));
    eventBus.on("character:idle", (payload) => runRules("character:idle", payload));
    eventBus.on("area:hover", (payload) => runRules("area:hover", payload));
    eventBus.on("command:hover", (payload) => runRules("command:hover", payload));
    eventBus.on("character:randomPrompt", (payload) => runRules("character:randomPrompt", payload));
    eventBus.on("command:line", (payload) => runRules("command:line", payload));
    eventBus.on("command:fortune", (payload) => runRules("command:fortune", payload));
    eventBus.on("command:hide", () => {
        touchInteraction();
        state.isHidden = !state.isHidden;
        elements.stage.classList.toggle("is-hidden", state.isHidden);
        if (state.isHidden) {
            renderSpeech(dialogue.line("onHide"));
            addLog("character:hide");
            return;
        }
        renderSpeech(dialogue.line("onShow"));
        addLog("character:show");
    });
    /**
     * 캐릭터 sprite 클릭 좌표를 부위 이벤트로 변환합니다.
     */
    const handleSpriteClick = (event) => {
        if (event.detail === 0) {
            eventBus.emit("character:click");
            return;
        }
        if (event.detail >= 2) {
            const part = getCharacterTouchPart(event.clientX, event.clientY, elements.sprite.getBoundingClientRect());
            eventBus.emit("character:double_click", { part });
            return;
        }
        const part = getCharacterTouchPart(event.clientX, event.clientY, elements.sprite.getBoundingClientRect());
        eventBus.emit("character:touch", { part });
    };
    elements.sprite.addEventListener("click", handleSpriteClick);
    cleanupCallbacks.push(() => elements.sprite.removeEventListener("click", handleSpriteClick));
    elements.menuButtons.forEach((button) => {
        const command = button.dataset.command;
        if (!isRuntimeCommandId(command)) {
            return;
        }
        const handleCommandHover = () => {
            eventBus.emit("command:hover", { command });
        };
        const handleCommandClick = () => {
            eventBus.emit(`command:${command}`);
        };
        button.addEventListener("pointerenter", handleCommandHover);
        button.addEventListener("focusin", handleCommandHover);
        button.addEventListener("click", handleCommandClick);
        cleanupCallbacks.push(() => {
            button.removeEventListener("pointerenter", handleCommandHover);
            button.removeEventListener("focusin", handleCommandHover);
            button.removeEventListener("click", handleCommandClick);
        });
    });
    elements.observeAreas.forEach((areaElement) => {
        const emitAreaHover = () => {
            const area = areaElement.dataset.observeArea;
            if (!isInteractiveAreaId(area)) {
                return;
            }
            eventBus.emit("area:hover", { area });
        };
        areaElement.addEventListener("mouseenter", emitAreaHover);
        areaElement.addEventListener("focusin", emitAreaHover);
        cleanupCallbacks.push(() => {
            areaElement.removeEventListener("mouseenter", emitAreaHover);
            areaElement.removeEventListener("focusin", emitAreaHover);
        });
    });
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
        if (idleTime >= timing.randomPromptDelay &&
            promptCooldown >= timing.randomPromptCooldown &&
            Math.random() < timing.randomPromptChance) {
            eventBus.emit("character:randomPrompt");
        }
    }, 3000);
    cleanupCallbacks.push(() => {
        window.clearInterval(idleTimer);
        window.clearInterval(statusTimer);
        window.clearInterval(randomPromptTimer);
        speechTypingToken += 1;
        if (speechTypingTimer !== null) {
            window.clearTimeout(speechTypingTimer);
        }
        actionTimers.forEach((timerId) => window.clearTimeout(timerId));
        actionTimers.clear();
    });
    renderCharacterState();
    renderStatusPanel();
    eventBus.emit("runtime:ready");
    let isDestroyed = false;
    return {
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
}
//# sourceMappingURL=createGhostRuntime.js.map