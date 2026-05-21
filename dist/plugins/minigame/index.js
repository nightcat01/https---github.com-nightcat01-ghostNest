/**
 * Creates one rock-paper-scissors plugin variant for the selected player choice.
 */
export function createMinigamePlugin(choice, onResult) {
    return {
        id: `minigame_${choice}`,
        name: `가위바위보: ${choice}`,
        description: "선택한 패를 기준으로 간단한 가위바위보 결과를 반환합니다.",
        /**
         * Runs the minigame and converts the result into character speech.
         */
        execute: () => {
            const ghostChoices = ["가위", "바위", "보"];
            const ghostChoice = ghostChoices[Math.floor(Math.random() * ghostChoices.length)];
            let result = "draw";
            if (choice === ghostChoice) {
                result = "draw";
            }
            else if ((choice === "가위" && ghostChoice === "보") ||
                (choice === "바위" && ghostChoice === "가위") ||
                (choice === "보" && ghostChoice === "바위")) {
                result = "win";
            }
            else {
                result = "lose";
            }
            // 런타임에 전적 기록을 위임하기 위해 콜백 호출
            onResult(result);
            const expression = result === "win" ? "surprised" : result === "lose" ? "happy" : "neutral";
            const resultMessage = result === "win" ? "제가 졌네요..." : result === "lose" ? "제가 이겼어요!" : "비겼네요!";
            return {
                title: "가위바위보",
                message: `저는 [${ghostChoice}]! ${resultMessage}`,
                expression,
            };
        },
    };
}
//# sourceMappingURL=index.js.map