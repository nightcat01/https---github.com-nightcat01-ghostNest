/**
 * Creates demo menu items for user-facing UI preferences.
 */
export function createUiMenuItems() {
    return [
        {
            id: "balloon-theme",
            label: "말풍선 테마",
            description: "말풍선 분위기를 바꿔요. 선택한 값은 새로고침 후에도 유지돼요.",
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
            id: "balloon-font-size",
            label: "글꼴 크기",
            description: "말풍선 글자 크기를 바꿔요.",
            children: [
                {
                    id: "balloon-font-size-small",
                    label: "작게",
                    actions: [
                        { type: "change_balloon_font_size", size: "small" },
                        { type: "speak_text", text: "글씨를 조금 작게 만들었어요." },
                        { type: "log", label: "management.balloon_font_size.small" },
                    ],
                },
                {
                    id: "balloon-font-size-default",
                    label: "기본",
                    actions: [
                        { type: "change_balloon_font_size", size: "default" },
                        { type: "speak_text", text: "원래 글씨 크기로 돌아왔어요." },
                        { type: "log", label: "management.balloon_font_size.default" },
                    ],
                },
                {
                    id: "balloon-font-size-large",
                    label: "크게",
                    actions: [
                        { type: "change_balloon_font_size", size: "large" },
                        { type: "speak_text", text: "글씨를 조금 크게 만들었어요." },
                        { type: "log", label: "management.balloon_font_size.large" },
                    ],
                },
            ],
        },
        {
            id: "menu-ui",
            label: "메뉴 UI",
            description: "메뉴를 말풍선 안에 띄울지, 별도 패널로 띄울지 고를 수 있어요.",
            children: [
                {
                    id: "menu-ui-default-balloon",
                    label: "기본: 말풍선",
                    actions: [
                        { type: "set_management_menu_display", display: "balloon" },
                        { type: "speak_text", text: "기본 메뉴를 말풍선 안에서 열도록 바꿨어요." },
                        { type: "log", label: "management.menu_ui.default.balloon" },
                    ],
                },
                {
                    id: "menu-ui-default-panel",
                    label: "기본: 패널",
                    actions: [
                        { type: "set_management_menu_display", display: "panel" },
                        { type: "speak_text", text: "기본 메뉴를 별도 패널로 열도록 바꿨어요." },
                        { type: "log", label: "management.menu_ui.default.panel" },
                    ],
                },
                {
                    id: "menu-ui-system-balloon",
                    label: "시스템: 말풍선",
                    actions: [
                        { type: "set_management_menu_display", menuId: "system-tools", display: "balloon" },
                        { type: "speak_text", text: "시스템 도구 메뉴를 말풍선 방식으로 바꿨어요." },
                        { type: "log", label: "management.menu_ui.system.balloon" },
                    ],
                },
                {
                    id: "menu-ui-system-panel",
                    label: "시스템: 패널",
                    actions: [
                        { type: "set_management_menu_display", menuId: "system-tools", display: "panel" },
                        { type: "speak_text", text: "시스템 도구 메뉴를 패널 방식으로 바꿨어요." },
                        { type: "log", label: "management.menu_ui.system.panel" },
                    ],
                },
                {
                    id: "menu-ui-reset",
                    label: "UI 초기화",
                    actions: [
                        { type: "reset_runtime_ui" },
                        { type: "speak_text", text: "메뉴와 말풍선 설정을 기본값으로 돌려둘게요." },
                        { type: "log", label: "management.menu_ui.reset" },
                    ],
                },
            ],
        },
    ];
}
//# sourceMappingURL=uiMenuItems.js.map