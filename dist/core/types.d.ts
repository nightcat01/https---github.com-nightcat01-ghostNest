export type RuntimeEventMap = {
    "runtime:ready": Record<string, never>;
    "character:click": Record<string, never>;
    "character:double_click": {
        part: CharacterTouchPart;
    };
    "character:touch": {
        part: CharacterTouchPart;
    };
    "character:right_click": Record<string, never>;
    "area:hover": {
        area: InteractiveAreaId;
    };
    "character:randomPrompt": Record<string, never>;
    "character:idle": Record<string, never>;
    "command:hover": {
        command: RuntimeCommandId;
    };
    "command:line": Record<string, never>;
    "command:fortune": Record<string, never>;
    "command:hide": Record<string, never>;
};
export type RuntimeEventName = keyof RuntimeEventMap;
export type RuntimeEventHandler<TEventName extends RuntimeEventName> = (payload: RuntimeEventMap[TEventName]) => void;
export type CharacterProfile = {
    id: string;
    name: string;
    description: string;
    tone: string;
    defaultExpression: CharacterExpression;
};
export type CharacterDefinition = {
    profile: CharacterProfile;
    lines: DialogueLineSet;
    assets?: CharacterAssets;
};
export type CharacterExpression = "neutral" | "happy" | "thinking" | "surprised";
export type CharacterTouchArea = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};
export type CharacterAssets = {
    expressions: Record<CharacterExpression, CharacterExpressionAsset>;
    alt: string;
    hitAreas?: Partial<Record<CharacterTouchPart, CharacterTouchArea>>;
};
export type CharacterExpressionAsset = string | string[];
export type CharacterTouchPart = string & {};
export type InteractiveAreaId = "runtimeTitle" | "eventLog" | "commandMenu";
export type RuntimeCommandId = "fortune" | "line" | "hide";
export type DialogueCategory = "onMount" | "onClick" | "onTouchHead" | "onTouchFace" | "onTouchBody" | "onHoverRuntimeTitle" | "onHoverEventLog" | "onHoverCommandMenu" | "onHoverFortuneCommand" | "onHoverLineCommand" | "onHoverHideCommand" | "onRandomPrompt" | "onIdle" | "onLine" | "onHide" | "onShow";
export type DialogueLineSet = Record<DialogueCategory, string[]>;
export type DialogueMessage = {
    speaker: string;
    text: string;
};
export type RuntimeAction = {
    type: "speak";
    category: DialogueCategory;
} | {
    type: "speak_text";
    text: string;
} | {
    type: "change_expression";
    expression: CharacterExpression;
    clearTouchedPart?: boolean;
} | {
    type: "set_touched_part";
    part: CharacterTouchPart | null;
} | {
    type: "toggle_hidden";
} | {
    type: "call_plugin";
    pluginId: string;
} | {
    type: "log";
    label: string;
} | {
    type: "touch_interaction";
} | {
    type: "mark_prompted";
} | {
    type: "play_animation";
    animation: string;
    duration?: number;
} | {
    type: "open_ui";
    target: string;
} | {
    type: "close_ui";
    target: string;
} | {
    type: "navigate";
    route: string;
} | {
    type: "set_state";
    state: CharacterRuntimeMode;
} | {
    type: "emit_event";
    event: RuntimeEventName;
    payload?: RuntimeEventMap[RuntimeEventName];
} | {
    type: "play_sound";
    sound: string;
    volume?: number;
} | {
    type: "save_data";
    key: string;
    value: unknown;
} | {
    type: "load_data";
    key: string;
    saveTo?: string;
    speak?: boolean;
} | {
    type: "show_notification";
    title: string;
    message: string;
} | {
    type: "start_timer";
    timer: string;
    duration: number;
    actions: RuntimeAction[];
} | {
    type: "stop_timer";
    timer: string;
} | {
    type: "move_character";
    x: number;
    y: number;
} | {
    type: "change_balloon";
    theme: string;
} | {
    type: "open_management_menu";
    title?: string;
    items: ManagementMenuItem[];
} | {
    type: "close_management_menu";
};
export type ManagementMenuItem = {
    id: string;
    label: string;
    actions?: RuntimeAction[];
    children?: ManagementMenuItem[];
};
export type RuntimeRule = {
    id: string;
    event: RuntimeEventName;
    when?: RuntimeRuleWhen;
    conditions?: RuntimeCondition[];
    actions: RuntimeAction[];
};
export type RuntimeRuleWhen = Partial<{
    part: CharacterTouchPart;
    area: InteractiveAreaId;
    command: RuntimeCommandId;
}>;
export type RuntimeCondition = {
    type: "feature_enabled";
    feature: keyof RuntimeFeatureOptions;
} | {
    type: "not_hidden";
} | {
    type: "mode_is";
    state: CharacterRuntimeMode;
} | {
    type: "cooldown";
    key: string;
    duration: number;
};
export type CharacterRuntimeMode = "idle" | "talking" | "sleeping" | "embarrassed" | "angry" | "focused" | "service_active";
export type RuntimeState = {
    isHidden: boolean;
    lastInteractionAt: number;
    expression: CharacterExpression;
    lastTouchedPart: CharacterTouchPart | null;
    lastPromptedAt: number;
    mode: CharacterRuntimeMode;
    data: Record<string, unknown>;
};
export type RuntimePlugin<TResult extends PluginResult = PluginResult> = {
    id: string;
    name: string;
    description?: string;
    execute: () => TResult | Promise<TResult>;
};
export type RuntimeSelectors = {
    stage: string;
    sprite: string;
    spriteImage: string;
    speakerName: string;
    speechText: string;
    balloonActionMenu?: string;
    eventLog: string;
    menuButtons: string;
    hitboxEditor?: string;
    hitboxEditorAdd?: string;
    hitboxEditorClose?: string;
    hitboxEditorBody?: string;
    hitboxEditorCopy?: string;
    restoreBadge?: string;
    observeAreas: string;
    statusMode?: string;
    statusExpression?: string;
    statusVisibility?: string;
    statusLastEvent?: string;
    statusIdleCountdown?: string;
    statusRandomPrompt?: string;
    statusActionTimers?: string;
};
export type CharacterSpriteSizeOptions = {
    desktopWidth: string;
    desktopHeight: string;
    mobileWidth: string;
    mobileHeight: string;
};
export type RuntimeTimingOptions = {
    idleDelay: number;
    randomPromptDelay: number;
    randomPromptCooldown: number;
    randomPromptChance: number;
    areaHoverCooldown: number;
};
export type RuntimeFeatureOptions = {
    commandHoverDescription: boolean;
    debugHitAreas?: boolean;
};
export type SpeechTypingOptions = {
    enabled: boolean;
    interval: number;
};
export type StorageAdapter = {
    get: (key: string) => unknown | Promise<unknown>;
    set: (key: string, value: unknown) => void | Promise<void>;
    remove: (key: string) => void | Promise<void>;
};
export type DialogueEngine = {
    line: (category: DialogueCategory) => DialogueMessage | Promise<DialogueMessage>;
    custom: (text: string) => DialogueMessage | Promise<DialogueMessage>;
};
export type GhostRuntimeOptions = {
    character: CharacterDefinition;
    plugins?: RuntimePlugin[];
    selectors: RuntimeSelectors;
    timing?: Partial<RuntimeTimingOptions>;
    features?: Partial<RuntimeFeatureOptions>;
    typing?: Partial<SpeechTypingOptions>;
    spriteSize?: Partial<CharacterSpriteSizeOptions>;
    rules?: RuntimeRule[];
    maxLogItems?: number;
    dialogueEngine?: DialogueEngine;
    storageAdapter?: StorageAdapter;
};
export type GhostRuntime = {
    emit: <TEventName extends RuntimeEventName>(eventName: TEventName, payload?: RuntimeEventMap[TEventName]) => void;
    destroy: () => void;
};
export type PluginResult = {
    title: string;
    message: string;
    expression?: CharacterExpression;
};
//# sourceMappingURL=types.d.ts.map