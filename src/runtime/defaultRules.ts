import type {
  CharacterExpression,
  CharacterTouchPart,
  DialogueCategory,
  InteractiveAreaId,
  RuntimeCommandId,
  RuntimeRule,
  RuntimeTimingOptions,
} from "../core/types.js";

const touchPartConfig: Record<
  CharacterTouchPart,
  {
    expression: CharacterExpression;
    dialogueCategory: DialogueCategory;
    logLabel: string;
  }
> = {
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

const areaHoverConfig: Record<
  InteractiveAreaId,
  {
    dialogueCategory: DialogueCategory;
    logLabel: string;
  }
> = {
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

const commandHoverConfig: Record<
  RuntimeCommandId,
  {
    dialogueCategory: DialogueCategory;
    logLabel: string;
  }
> = {
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
export function createDefaultRules(timing: RuntimeTimingOptions): RuntimeRule[] {
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
        { type: "speak_text", text: "앗, 거기는 왜 자꾸 누르시나요?" },
        { type: "log", label: "character:double_click" },
      ],
    },
    {
      id: "character.right_click.management_menu",
      event: "character:right_click",
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
              id: "weather",
              label: "날씨",
              actions: [
                { type: "call_plugin", pluginId: "weather" },
                { type: "log", label: "management.weather" },
              ],
            },
            {
              id: "system-info",
              label: "시스템 정보",
              actions: [
                { type: "call_plugin", pluginId: "system_info" },
                { type: "log", label: "management.system_info" },
              ],
            },
            {
              id: "minigame",
              label: "가위바위보",
              children: [
                {
                  id: "minigame-scissors",
                  label: "가위",
                  actions: [
                    { type: "call_plugin", pluginId: "minigame_가위" },
                    { type: "log", label: "management.minigame.scissors" },
                  ],
                },
                {
                  id: "minigame-rock",
                  label: "바위",
                  actions: [
                    { type: "call_plugin", pluginId: "minigame_바위" },
                    { type: "log", label: "management.minigame.rock" },
                  ],
                },
                {
                  id: "minigame-paper",
                  label: "보",
                  actions: [
                    { type: "call_plugin", pluginId: "minigame_보" },
                    { type: "log", label: "management.minigame.paper" },
                  ],
                },
              ],
            },
            {
              id: "timer-3m",
              label: "3분 타이머",
              actions: [
                { type: "call_plugin", pluginId: "timer" },
                {
                  type: "start_timer",
                  timer: "cup_ramen",
                  duration: 180000,
                  actions: [
                    { type: "show_notification", title: "타이머 완료", message: "3분이 지났어요!" },
                    { type: "play_animation", animation: "jump", duration: 500 },
                    { type: "speak_text", text: "3분이 지났어요! 얼른 확인해보세요." },
                  ],
                },
                { type: "log", label: "management.start_timer" },
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
            {
              id: "hitbox-editor",
              label: "[개발자] 히트박스 설정",
              actions: [
                { type: "close_management_menu" },
                { type: "open_ui", target: "hitbox_editor" },
                { type: "log", label: "management.open_hitbox_editor" },
              ],
            },
            {
              id: "close",
              label: "나가기",
              actions: [
                { type: "close_management_menu" },
                { type: "change_expression", expression: "neutral" },
                { type: "speak_text", text: "메뉴를 닫을게요." },
                { type: "log", label: "management.close" },
              ],
            },
          ],
        },
        { type: "log", label: "character:right_click.management_menu" },
      ],
    },
    ...Object.entries(touchPartConfig).map(
      ([part, config]): RuntimeRule => ({
        id: `character.touch.${part}`,
        event: "character:touch",
        when: { part: part as keyof typeof touchPartConfig },
        actions: [
          { type: "touch_interaction" },
          { type: "change_expression", expression: config.expression },
          { type: "set_touched_part", part: part as keyof typeof touchPartConfig },
          { type: "speak", category: config.dialogueCategory },
          { type: "log", label: config.logLabel },
        ],
      }),
    ),
    {
      id: "character.idle",
      event: "character:idle",
      actions: [
        { type: "change_expression", expression: "neutral", clearTouchedPart: true },
        { type: "speak", category: "onIdle" },
        { type: "log", label: "character:idle" },
      ],
    },
    ...Object.entries(areaHoverConfig).map(
      ([area, config]): RuntimeRule => ({
        id: `area.hover.${area}`,
        event: "area:hover",
        when: { area: area as keyof typeof areaHoverConfig },
        conditions: [{ type: "cooldown", key: `area:hover:${area}`, duration: timing.areaHoverCooldown }],
        actions: [
          { type: "touch_interaction" },
          { type: "change_expression", expression: "thinking", clearTouchedPart: true },
          { type: "speak", category: config.dialogueCategory },
          { type: "log", label: config.logLabel },
        ],
      }),
    ),
    ...Object.entries(commandHoverConfig).map(
      ([command, config]): RuntimeRule => ({
        id: `command.hover.${command}`,
        event: "command:hover",
        when: { command: command as keyof typeof commandHoverConfig },
        conditions: [{ type: "feature_enabled", feature: "commandHoverDescription" }],
        actions: [
          { type: "touch_interaction" },
          { type: "change_expression", expression: "thinking", clearTouchedPart: true },
          { type: "speak", category: config.dialogueCategory },
          { type: "log", label: config.logLabel },
        ],
      }),
    ),
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
