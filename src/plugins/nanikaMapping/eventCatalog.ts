import type { RuntimeControlOptions, RuntimeEventName } from "../../core/types.js";

export type RuntimeEventCatalogItem = {
  event: RuntimeEventName;
  label: string;
  description: string;
  payloadFields?: Array<{
    name: string;
    description: string;
  }>;
  requiredControls?: Array<keyof RuntimeControlOptions>;
};

/**
 * Lists runtime events that can be used as rule mapping triggers.
 */
export const runtimeEventCatalog = [
  {
    event: "runtime:ready",
    label: "런타임 시작",
    description: "나니카 런타임이 준비되었을 때 실행됩니다.",
  },
  {
    event: "character:click",
    label: "캐릭터 클릭",
    description: "캐릭터를 한 번 클릭했을 때 실행됩니다.",
    requiredControls: ["characterClick"],
  },
  {
    event: "character:double_click",
    label: "캐릭터 더블 클릭",
    description: "캐릭터를 더블 클릭했을 때 실행됩니다.",
    requiredControls: ["characterTouch"],
    payloadFields: [
      { name: "part", description: "클릭된 hit area 부위입니다." },
    ],
  },
  {
    event: "character:touch",
    label: "캐릭터 부위 터치",
    description: "캐릭터의 hit area 부위를 클릭했을 때 실행됩니다.",
    requiredControls: ["characterTouch"],
    payloadFields: [
      { name: "part", description: "클릭된 hit area 부위입니다." },
    ],
  },
  {
    event: "character:right_click",
    label: "캐릭터 우클릭",
    description: "캐릭터 영역에서 context menu 입력이 발생했을 때 실행됩니다.",
    requiredControls: ["characterRightClick"],
  },
  {
    event: "area:hover",
    label: "관찰 영역 hover",
    description: "data-observe-area 영역에 hover 또는 focus가 들어왔을 때 실행됩니다.",
    requiredControls: ["areaHoverDescription"],
    payloadFields: [
      { name: "area", description: "관찰 영역 id입니다." },
    ],
  },
  {
    event: "character:randomPrompt",
    label: "랜덤 발화",
    description: "랜덤 발화 조건을 만족했을 때 실행됩니다.",
    requiredControls: ["randomPrompt"],
  },
  {
    event: "character:idle",
    label: "Idle 반응",
    description: "사용자 상호작용 없이 idle 시간이 지났을 때 실행됩니다.",
    requiredControls: ["idleReaction"],
  },
  {
    event: "command:hover",
    label: "명령 버튼 hover",
    description: "data-command 버튼에 hover 또는 focus가 들어왔을 때 실행됩니다.",
    requiredControls: ["commandButtons", "commandHoverDescription"],
    payloadFields: [
      { name: "command", description: "명령 버튼 id입니다." },
    ],
  },
  {
    event: "command:line",
    label: "대사 버튼",
    description: "line 명령 버튼을 눌렀을 때 실행됩니다.",
    requiredControls: ["commandButtons"],
  },
  {
    event: "command:hide",
    label: "숨김 버튼",
    description: "hide 명령 버튼 또는 복구 badge를 눌렀을 때 실행됩니다.",
    requiredControls: ["commandButtons"],
  },
] as const satisfies readonly RuntimeEventCatalogItem[];

/**
 * Finds catalog metadata for a runtime event name.
 */
export function getRuntimeEventCatalogItem(event: RuntimeEventName) {
  return runtimeEventCatalog.find((item) => item.event === event);
}
