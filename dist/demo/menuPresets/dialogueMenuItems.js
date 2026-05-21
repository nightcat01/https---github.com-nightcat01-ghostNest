/**
 * Creates demo menu items for dialogue output and JSON DialogueScript playback.
 */
export function createDialogueMenuItems() {
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
    ];
}
//# sourceMappingURL=dialogueMenuItems.js.map