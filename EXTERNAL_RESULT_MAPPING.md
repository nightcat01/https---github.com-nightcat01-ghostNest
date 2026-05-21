# External Result To Action Mapping

이 문서는 AI, API, DB, 사용자 입력 같은 외부 결과를 GhostNest 액션으로 연결하는 예시를 정리한다.

핵심 원칙은 간단하다.

```txt
외부 기능은 개발자 코드에서 처리한다
-> GhostNest가 이해하는 결과로 변환한다
-> src/ghost/actions.ts에서 액션으로 매핑한다
```

GhostNest 코어는 API 인증, DB query, AI prompt, 서비스 정책을 알지 않는다.

## 어떤 경계를 쓸까

| 상황 | 권장 경계 | 이유 |
| --- | --- | --- |
| 버튼/메뉴를 눌렀을 때 API, DB, AI 결과를 가져온다 | `RuntimePlugin` | `call_plugin` 액션으로 연결하기 가장 단순하다 |
| 캐릭터의 말투나 대사 생성 방식을 통째로 바꾼다 | `DialogueEngine` | `speak` 계열 액션의 대사 생성 책임을 바꿀 수 있다 |
| 사용자 설정이나 원격 저장소를 바꾼다 | `StorageAdapter` | 저장 위치를 localStorage 밖으로 옮길 수 있다 |
| 여러 액션을 서비스 의미 하나로 묶는다 | custom action | 기본 액션 조합을 재사용 가능한 단위로 감싼다 |

먼저 `RuntimePlugin`으로 표현 가능한지 확인하고, 대사 생성 자체가 문제라면 `DialogueEngine`, 저장소 문제가 있으면 `StorageAdapter`를 검토한다.

## RuntimePlugin 예시

API, DB, AI 결과를 버튼이나 메뉴에 연결할 때 가장 기본적인 방식이다.

```ts
import type { RuntimePlugin } from "../core/types.js";

export const aiSummaryPlugin: RuntimePlugin = {
  id: "ai_summary",
  name: "AI 요약",
  description: "현재 화면 내용을 요약해서 캐릭터 대사로 반환합니다.",
  async execute() {
    const summary = await myAiService.summarizeCurrentPage();

    return {
      title: "AI 요약",
      message: summary.text,
      expression: summary.confident ? "happy" : "thinking",
      script: [
        { type: "text", value: "요약해봤어요." },
        { type: "wait", ms: 300 },
        { type: "newline" },
        { type: "text", value: summary.text },
        { type: "end" },
      ],
    };
  },
};
```

`nanika.config.ts`에 등록한다.

```ts
const externalFeatures = [
  ...createDemoPlugins(),
  aiSummaryPlugin,
] satisfies RuntimePlugin[];
```

`actions.ts`에서 메뉴나 이벤트에 매핑한다.

```ts
{
  id: "ai-summary",
  label: "AI 요약",
  description: "현재 화면 내용을 요약해요.",
  actions: [
    { type: "call_plugin", pluginId: "ai_summary" },
    { type: "log", label: "management.ai_summary" },
  ],
}
```

이 흐름에서 개발자는 AI 호출과 결과 변환을 책임지고, GhostNest는 결과를 말풍선, 표정, script로 표현한다.

## DB 조회 예시

DB 결과도 같은 방식으로 plugin에서 처리한다.

```ts
export const lastOrderPlugin: RuntimePlugin = {
  id: "last_order",
  name: "최근 주문 확인",
  async execute() {
    const order = await orderRepository.findLatestForCurrentUser();

    if (!order) {
      return {
        title: "최근 주문",
        message: "아직 주문 내역이 없어요.",
        expression: "thinking",
      };
    }

    return {
      title: "최근 주문",
      message: `가장 최근 주문은 ${order.name}이고, 상태는 ${order.status}예요.`,
      expression: "happy",
    };
  },
};
```

DB 연결 문자열, 인증, query 최적화는 GhostNest 코어가 아니라 개발자 앱 또는 서버 adapter가 맡는다.

## DialogueEngine 예시

`speak` 액션이 사용하는 대사 생성 방식을 바꾸고 싶다면 `DialogueEngine`을 주입한다.

```ts
import type { DialogueEngine } from "../core/types.js";

export const aiDialogueEngine: DialogueEngine = {
  async line(category) {
    const answer = await myAiService.generateLine({
      category,
      character: "rine",
    });

    return {
      text: answer.text,
      expression: answer.expression ?? "neutral",
      script: answer.script,
    };
  },
  async custom(text) {
    const polished = await myAiService.rewriteAsCharacter(text);

    return {
      text: polished.text,
      expression: polished.expression ?? "thinking",
      script: polished.script,
    };
  },
};
```

`nanika.config.ts`에서 연결한다.

```ts
export const nanikaConfig = {
  plugins: externalFeatures,
  selectors: runtimeSelectors,
  dialogueEngine: aiDialogueEngine,
} satisfies Omit<GhostRuntimeOptions, "character" | "rules">;
```

이 방식은 메뉴 하나가 아니라 캐릭터의 대사 생성 경로 전체를 바꾸고 싶을 때 쓴다.

## StorageAdapter 예시

사용자 설정이나 저장값을 localStorage가 아닌 서버/DB에 저장하고 싶다면 `StorageAdapter`를 교체한다.

```ts
import type { StorageAdapter } from "../core/types.js";

export const remoteStorageAdapter: StorageAdapter = {
  async get(key) {
    return userSettingsApi.getValue(key);
  },
  async set(key, value) {
    await userSettingsApi.setValue(key, value);
  },
  async remove(key) {
    await userSettingsApi.removeValue(key);
  },
};
```

`nanika.config.ts`에서 연결한다.

```ts
export const nanikaConfig = {
  plugins: externalFeatures,
  selectors: runtimeSelectors,
  storageAdapter: remoteStorageAdapter,
} satisfies Omit<GhostRuntimeOptions, "character" | "rules">;
```

`save_data`, `load_data`, UI preference 저장은 이 adapter 경계를 통해 처리된다.

## Custom Action 예시

여러 기본 액션을 서비스 의미 하나로 묶고 싶을 때 custom action을 쓸 수 있다.

```ts
runtime.registerAction("show_recommendation", async (action, context) => {
  const product = await recommendationService.pickForCurrentUser();

  await context.runActions([
    { type: "change_expression", expression: "thinking" },
    {
      type: "speak_script",
      text: `${product.name}을 추천해요.`,
      script: [
        { type: "text", value: `${product.name}을 추천해요.` },
        { type: "wait", ms: 400 },
        { type: "newline" },
        { type: "text", value: product.reason },
      ],
    },
    { type: "open_ui", target: "product_recommendation" },
  ]);
});
```

그리고 action mapping에서는 얇게 호출한다.

```ts
{
  id: "recommend-product",
  label: "추천 보기",
  actions: [
    { type: "show_recommendation" },
    { type: "log", label: "management.recommend_product" },
  ],
}
```

주의할 점은 custom action이 서비스 로직을 코어로 끌어들이는 통로가 되면 안 된다는 것이다. 가능하면 외부 호출은 앱 서비스나 adapter에 두고, custom action은 결과를 GhostNest 액션으로 번역하는 얇은 연결부로 유지한다.

## 후속 액션 연결

`call_plugin`은 plugin 실행이 끝날 때까지 기다린다. 하지만 plugin 결과로 시작된 대사 연출이 완전히 끝날 때까지 기다리지는 않는다.

```ts
actions: [
  { type: "call_plugin", pluginId: "ai_summary" },
  { type: "play_animation", animation: "jump", duration: 460 },
]
```

위 예시는 AI 결과 출력 요청 뒤 바로 점프 애니메이션을 시작할 수 있다.

대사 중간 타이밍이 중요하면 plugin이 `script`를 반환하거나, 후속 행동을 timer로 분리한다.

```ts
actions: [
  { type: "call_plugin", pluginId: "ai_summary" },
  {
    type: "start_timer",
    timer: "after_ai_summary",
    duration: 1200,
    actions: [
      { type: "play_animation", animation: "jump", duration: 460 },
      { type: "log", label: "ai_summary.after_animation" },
    ],
  },
]
```

## 체크리스트

외부 기능을 붙이기 전에 다음을 확인한다.

1. 외부 호출 코드는 GhostNest 코어 밖에 있는가?
2. 결과가 `PluginResult`, `DialogueMessage`, 저장값, 또는 `RuntimeAction[]` 중 하나로 변환되는가?
3. 메뉴나 이벤트에서는 구현이 아니라 액션 매핑만 하고 있는가?
4. 후속 액션의 타이밍이 필요한가?
5. 대사 연출이 필요하면 JSON `DialogueScript`로 표현했는가?
6. 저장이 필요하면 `StorageAdapter` 경계를 고려했는가?
