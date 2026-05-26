export type RuntimeCommandId = "line" | "hide" | (string & {});

export type RuntimeCommandEventName = `command:${RuntimeCommandId}`;

export type BaseRuntimeEventMap = {
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
};

export type RuntimeEventMap = BaseRuntimeEventMap & Record<RuntimeCommandEventName, Record<string, never>>;

export type RuntimeEventName = keyof RuntimeEventMap;

export type RuntimeEventHandler<TEventName extends RuntimeEventName> = (
  payload: RuntimeEventMap[TEventName],
) => void;

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
  surfaces?: Record<string, CharacterSurface>;
  alt: string;
  hitAreas?: Partial<Record<CharacterTouchPart, CharacterTouchArea>>;
};

export type CharacterExpressionAsset = string | string[];

export type CharacterLayerId = "base" | "eyes" | "mouth" | "ears" | "accessory" | (string & {});

export type CharacterLayer = {
  image?: string;
  frames?: string[];
  depth?: number;
  intervalMs?: number;
  idleIntervalMs?: number;
  coversBase?: boolean;
  placement?: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: "percent";
  };
};

export type CharacterSurface = {
  id: string;
  image?: string;
  expression?: CharacterExpression;
  alt?: string;
  layers?: Partial<Record<CharacterLayerId, CharacterLayer>>;
  mouthImages?: {
    closed: string;
    open: string;
  };
};

export type RuntimeSceneLayerRole = "background" | "character" | "prop" | "foreground" | "effect" | (string & {});

export type RuntimeSceneLayer = {
  id: string;
  role: RuntimeSceneLayerRole;
  image?: string;
  color?: string;
  depth?: number;
  alt?: string;
  className?: string;
  placement?: {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: "percent";
  };
};

export type RuntimeScene = {
  id: string;
  layers: RuntimeSceneLayer[];
};

export type RuntimeSceneOptions = {
  defaultScene?: string;
  layers?: RuntimeSceneLayer[];
  scenes?: Record<string, RuntimeScene>;
  sceneSets?: Record<string, RuntimeScene[]>;
};

export type CharacterTouchPart = string & {};

export type InteractiveAreaId = "runtimeTitle" | "eventLog" | "commandMenu" | (string & {});

export type BuiltinDialogueCategory =
  | "onMount"
  | "onClick"
  | "onTouchHead"
  | "onTouchFace"
  | "onTouchBody"
  | "onHoverRuntimeTitle"
  | "onHoverEventLog"
  | "onHoverCommandMenu"
  | "onHoverFortuneCommand"
  | "onHoverLineCommand"
  | "onHoverHideCommand"
  | "onRandomPrompt"
  | "onIdle"
  | "onLine"
  | "onHide"
  | "onShow";

export type DialogueCategory = BuiltinDialogueCategory | (string & {});

export type DialogueLineSet = Partial<Record<DialogueCategory, string[]>>;

export type DialogueMessage = {
  speaker: string;
  text: string;
  script?: DialogueScript;
};

export type DialogueScript = DialogueToken[];

export type DialogueToken =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "wait";
      ms: number;
    }
  | {
      type: "surface";
      id: string;
      startIdleLayers?: boolean;
    }
  | {
      type: "clear";
    }
  | {
      type: "newline";
    }
  | {
      type: "choice";
      choices: DialogueChoice[];
    }
  | {
      type: "end";
    };

export type DialogueChoice = {
  label: string;
  actions: RuntimeAction[];
};

export type BuiltinRuntimeAction =
  | {
      type: "speak";
      category: DialogueCategory;
    }
  | {
      type: "speak_text";
      text: string;
    }
  | {
      type: "speak_script";
      text: string;
      script: DialogueScript;
    }
  | {
      type: "change_expression";
      expression: CharacterExpression;
      clearTouchedPart?: boolean;
    }
  | {
      type: "surface";
      id: string;
      startIdleLayers?: boolean;
    }
  | {
      type: "set_touched_part";
      part: CharacterTouchPart | null;
    }
  | {
      type: "toggle_hidden";
    }
  | {
      type: "call_plugin";
      pluginId: string;
    }
  | {
      type: "log";
      label: string;
    }
  | {
      type: "touch_interaction";
    }
  | {
      type: "mark_prompted";
    }
  | {
      type: "play_animation";
      animation: string;
      duration?: number;
    }
  | {
      type: "play_layer_animation";
      layerId: CharacterLayerId;
      duration?: number;
      active?: boolean;
    }
  | {
      type: "open_ui";
      target: string;
    }
  | {
      type: "close_ui";
      target: string;
    }
  | {
      type: "navigate";
      route: string;
    }
  | {
      type: "set_state";
      state: CharacterRuntimeMode;
    }
  | {
      type: "emit_event";
      event: RuntimeEventName;
      payload?: RuntimeEventMap[RuntimeEventName];
    }
  | {
      type: "play_sound";
      sound: string;
      volume?: number;
    }
  | {
      type: "save_data";
      key: string;
      value: unknown;
    }
  | {
      type: "load_data";
      key: string;
      saveTo?: string;
      speak?: boolean;
    }
  | {
      type: "show_notification";
      title: string;
      message: string;
    }
  | {
      type: "start_timer";
      timer: string;
      duration: number;
      actions: RuntimeAction[];
    }
  | {
      type: "stop_timer";
      timer: string;
    }
  | {
      type: "move_character";
      x: number;
      y: number;
    }
  | {
      type: "change_balloon";
      theme: string;
    }
  | {
      type: "change_balloon_font_size";
      size: string;
    }
  | {
      type: "open_management_menu";
      menuId?: string;
      title?: string;
      items: ManagementMenuItem[];
    }
  | {
      type: "set_management_menu_display";
      display: ManagementMenuDisplay;
      menuId?: string;
    }
  | {
      type: "reset_runtime_ui";
    }
  | {
      type: "close_management_menu";
    };

export type CustomRuntimeAction = {
  type: string & {}; // Allows any string, avoids narrowing to BuiltinRuntimeAction
  [key: string]: unknown;
};

export type RuntimeAction = BuiltinRuntimeAction | CustomRuntimeAction;

export type RuntimeActionHandler<TAction extends RuntimeAction = RuntimeAction> = (
  action: TAction,
  context: { runActions: (actions: RuntimeAction[]) => Promise<void> }
) => void | Promise<void>;

export type ManagementMenuItem = {
  id: string;
  label: string;
  description?: string;
  actions?: RuntimeAction[];
  children?: ManagementMenuItem[];
};

export type ManagementMenuDisplay = "balloon" | "panel" | (string & {});

export type ManagementMenuOptions = {
  defaultDisplay?: ManagementMenuDisplay;
  displays?: Record<string, ManagementMenuDisplay>;
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

export type RuntimeCondition =
  | {
      type: "feature_enabled";
      feature: keyof RuntimeFeatureOptions;
    }
  | {
      type: "not_hidden";
    }
  | {
      type: "mode_is";
      state: CharacterRuntimeMode;
    }
  | {
      type: "cooldown";
      key: string;
      duration: number;
    };

export type CharacterRuntimeMode =
  | "idle"
  | "talking"
  | "sleeping"
  | "embarrassed"
  | "angry"
  | "focused"
  | "service_active";

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
  speechBalloon?: string;
  speakerName: string;
  speechText: string;
  balloonActionMenu?: string;
  panelActionMenu?: string;
  menuButtons: string;
  restoreBadge?: string;
  observeAreas: string;
};

export type HitboxEditorDevtoolSelectors = {
  editor?: string;
  addButton?: string;
  closeButton?: string;
  body?: string;
  copyButton?: string;
};

export type RuntimeDiagnosticsDevtoolSelectors = {
  eventLog?: string;
  statusMode?: string;
  statusExpression?: string;
  statusVisibility?: string;
  statusLastEvent?: string;
  statusIdleCountdown?: string;
  statusRandomPrompt?: string;
  statusActionTimers?: string;
};

export type RuntimeDevtoolsOptions = {
  hitboxEditor?: {
    selectors: HitboxEditorDevtoolSelectors;
  };
  diagnostics?: {
    selectors: RuntimeDiagnosticsDevtoolSelectors;
  };
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
  scene?: RuntimeSceneOptions;
  devtools?: RuntimeDevtoolsOptions;
  managementMenu?: ManagementMenuOptions;
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
  emit: <TEventName extends RuntimeEventName>(
    eventName: TEventName,
    payload?: RuntimeEventMap[TEventName],
  ) => void;
  registerAction: (type: string, handler: RuntimeActionHandler) => void;
  destroy: () => void;
};

export type PluginResult = {
  title: string;
  message: string;
  expression?: CharacterExpression;
  script?: DialogueScript;
};
