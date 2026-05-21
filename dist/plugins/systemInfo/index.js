export const systemInfoPlugin = {
    id: "system_info",
    name: "시간 및 배터리 알리미",
    description: "브라우저에서 접근 가능한 시간과 배터리 정보를 반환합니다.",
    /**
     * Reads browser-supported system information and formats it as a PluginResult.
     */
    execute: async () => {
        const now = new Date();
        const timeString = new Intl.DateTimeFormat("ko-KR", {
            hour: "numeric",
            minute: "numeric",
        }).format(now);
        let batteryText = "";
        let expression = "neutral";
        try {
            // TypeScript가 기본적으로 navigator.getBattery를 모를 수 있으므로 any로 캐스팅
            if ("getBattery" in navigator) {
                const battery = await navigator.getBattery();
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? "충전 중" : "사용 중";
                if (level <= 20 && !battery.charging) {
                    batteryText = ` 배터리가 ${level}%밖에 없어요! 얼른 충전해 주세요.`;
                    expression = "surprised";
                }
                else if (level >= 80) {
                    batteryText = ` 배터리는 ${level}%로 넉넉해요.`;
                    expression = "happy";
                }
                else {
                    batteryText = ` 배터리는 ${level}% (${charging})이에요.`;
                }
            }
        }
        catch (e) {
            // API 지원 안될 시 조용히 넘어감
        }
        return {
            title: "시스템 정보",
            message: `지금은 ${timeString}이에요.${batteryText}`,
            expression,
        };
    },
};
//# sourceMappingURL=index.js.map