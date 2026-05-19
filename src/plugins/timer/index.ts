import type { RuntimePlugin } from "../../core/types.js";

export const timerPlugin: RuntimePlugin = {
  id: "timer",
  name: "3분 컵라면 타이머",
  execute: () => {
    return {
      title: "타이머 설정",
      message: "3분 타이머를 맞췄어요. 다 되면 알려드릴게요!",
      expression: "happy",
    };
  },
};
