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
export function createDefaultRules(timing) {
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
    ];
}
//# sourceMappingURL=defaultRules.js.map