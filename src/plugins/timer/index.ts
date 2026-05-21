import type { RuntimePlugin } from "../../core/types.js";

export const timerPlugin: RuntimePlugin = {
  id: "timer",
  name: "3분 컵라면 타이머",
  description: "타이머 시작 안내 메시지를 반환하고, 실제 예약은 action mapping에서 처리합니다.",
  /**
   * Returns the speech shown when the timer action mapping starts a timer.
   */
  execute: () => {
    return {
      title: "타이머 설정",
      message: "3분 타이머를 맞췄어요. 다 되면 알려드릴게요!",
      expression: "happy",
    };
  },
};
