export function createDemoManagementMenuItems() {
    return [
        {
            id: "say-line",
            label: "한마디",
            description: "리네가 짧은 대사를 하나 말해요.",
            actions: [
                { type: "speak", category: "onLine" },
                { type: "log", label: "management.say_line" },
            ],
        },
        {
            id: "script-demo",
            label: "연출/선택지 테스트",
            description: "대기, 줄바꿈, 선택지를 포함한 JSON 대사 연출 예시예요.",
            actions: [
                {
                    type: "speak_script",
                    text: "잠깐만요. 이런 식으로 선택지도 띄울 수 있어요.",
                    script: [
                        { type: "surface", id: "0" },
                        { type: "text", value: "잠깐만요." },
                        { type: "wait", ms: 450 },
                        { type: "newline" },
                        { type: "surface", id: "0" },
                        { type: "text", value: "이런 식으로 선택지를 띄울 수도 있어요." },
                        { type: "wait", ms: 250 },
                        {
                            type: "choice",
                            choices: [
                                {
                                    label: "점프해봐",
                                    actions: [
                                        { type: "play_animation", animation: "jump", duration: 460 },
                                        { type: "speak_text", text: "좋아요, 가볍게 뛰어볼게요!" },
                                    ],
                                },
                                {
                                    label: "괜찮아",
                                    actions: [{ type: "speak_text", text: "알겠어요. 그럼 계속 곁에 있을게요." }],
                                },
                            ],
                        },
                    ],
                },
                { type: "log", label: "management.script_demo" },
            ],
        },
        {
            id: "draw-fortune",
            label: "운세 실행",
            description: "외부 기능 결과를 받아 말풍선과 표정으로 보여주는 예시예요.",
            actions: [
                { type: "call_plugin", pluginId: "fortune" },
                { type: "log", label: "management.draw_fortune" },
            ],
        },
        {
            id: "weather",
            label: "날씨",
            description: "날씨 기능을 호출해서 결과를 캐릭터가 설명해요.",
            actions: [
                { type: "call_plugin", pluginId: "weather" },
                { type: "log", label: "management.weather" },
            ],
        },
        {
            id: "system-info",
            label: "시스템 정보",
            description: "시스템 도구 메뉴를 열어요. 패널형 메뉴 예시로 쓰기 좋아요.",
            actions: [
                {
                    type: "open_management_menu",
                    menuId: "system-tools",
                    title: "시스템 도구",
                    items: [
                        {
                            id: "system-info-run",
                            label: "시스템 정보 보기",
                            description: "현재 브라우저와 런타임 정보를 확인해요.",
                            actions: [
                                { type: "call_plugin", pluginId: "system_info" },
                                { type: "log", label: "management.system_info" },
                            ],
                        },
                        {
                            id: "weather-panel-run",
                            label: "날씨 확인",
                            description: "패널 안에서 날씨 기능을 실행해요.",
                            actions: [
                                { type: "call_plugin", pluginId: "weather" },
                                { type: "log", label: "management.panel.weather" },
                            ],
                        },
                        {
                            id: "panel-close",
                            label: "닫기",
                            actions: [{ type: "close_management_menu" }],
                        },
                    ],
                },
                { type: "log", label: "management.open_system_panel" },
            ],
        },
        {
            id: "minigame",
            label: "가위바위보",
            description: "메뉴 depth 안에서 미니게임 선택지를 보여주는 예시예요.",
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
            description: "3분 뒤 알림과 대사를 실행하는 타이머 예시예요.",
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
        {
            id: "jump",
            label: "점프",
            description: "캐릭터 sprite 애니메이션을 실행해요.",
            actions: [
                { type: "play_animation", animation: "jump", duration: 460 },
                { type: "speak_text", text: "자, 가볍게 뛰어볼게요!" },
                { type: "log", label: "management.animation.jump" },
            ],
        },
        {
            id: "layer-animation-test",
            label: "입모양 테스트",
            description: "mouth 레이어 애니메이션을 직접 실행해보는 테스트예요.",
            actions: [
                { type: "play_layer_animation", layerId: "mouth", duration: 1200 },
                { type: "log", label: "management.layer_animation.mouth" },
            ],
        },
        {
            id: "hide",
            label: "숨기기",
            description: "캐릭터를 잠시 숨기고, 배지로 다시 부를 수 있어요.",
            actions: [
                { type: "toggle_hidden" },
                { type: "speak", category: "onHide" },
                { type: "log", label: "management.hide" },
            ],
        },
        {
            id: "hitbox-editor",
            label: "[개발자] 히트박스 설정",
            description: "캐릭터 터치 영역을 조정하는 개발자 도구를 열어요.",
            actions: [
                { type: "close_management_menu" },
                { type: "open_ui", target: "hitbox_editor" },
                { type: "log", label: "management.open_hitbox_editor" },
            ],
        },
        {
            id: "close",
            label: "나가기",
            description: "열려 있는 메뉴를 닫아요.",
            actions: [
                { type: "close_management_menu" },
                { type: "change_expression", expression: "neutral" },
                { type: "speak_text", text: "메뉴를 닫을게요." },
                { type: "log", label: "management.close" },
            ],
        },
    ];
}
//# sourceMappingURL=demoManagementMenu.js.map