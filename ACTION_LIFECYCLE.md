# Action Lifecycle

## 목적

GhostNest의 액션은 외부 기능 자체를 구현하는 코드가 아니다.

액션은 개발자가 이미 만든 기능, API, DB, AI 결과를 나니카의 행동으로 연결하는 실행 단위다.

따라서 액션을 설계하거나 매핑할 때는 항상 다음 경계를 구분한다.

```txt
trigger -> actions[] -> action handler -> runtime/plugin/adapter -> output or next action
```

- `trigger`: 클릭, 우클릭, 메뉴 선택, 대사 선택지, idle, timer, 외부 eventBridge 호출 같은 시작점이다.
- `actions[]`: 순서대로 실행되는 행동 배열이다.
- `action handler`: 액션 타입별 실행기다.
- `runtime/plugin/adapter`: GhostNest 내부 기능 또는 개발자가 주입한 외부 연결점이다.
- `output`: 대사, 표정, 레이어 애니메이션, UI, 알림, 저장값 같은 결과다.

## 기본 실행 규칙

`actions[]`는 배열 순서대로 실행된다.

```ts
actions: [
  { type: "change_expression", expression: "thinking" },
  { type: "speak_text", text: "잠깐만요. 확인해볼게요." },
  { type: "play_animation", animation: "jump", duration: 460 },
]
```

다만 모든 액션이 "시각적 결과가 끝날 때까지" 기다리는 것은 아니다.

현재 기준에서 `runActions()`는 각 액션 handler의 Promise가 끝날 때까지 기다린다. 하지만 `speak_text`, `speak_script`, `play_animation`, `play_layer_animation`처럼 화면 연출을 시작하는 액션은 연출을 시작한 뒤 handler가 끝날 수 있다.

즉 위 예시는 "대사가 완전히 끝난 뒤 점프"가 아니라, "대사 재생을 시작하고 다음 액션으로 넘어감"에 가깝다.

대사 연출 중간에 명확한 타이밍을 넣고 싶다면 `speak_script`의 `wait` 토큰을 사용하거나, 별도의 timer/후속 이벤트 구조를 사용한다.

## Start와 End

액션의 start는 항상 런타임이 알고 있는 트리거에서 시작한다.

- `RuntimeRule.actions`
- `ManagementMenuItem.actions`
- `DialogueChoice.actions`
- `start_timer.actions`
- `eventBridge` 또는 `emit_event`로 이어진 rule
- custom action handler에서 호출하는 후속 `runActions()`

액션의 end는 액션 종류별로 다르다.

| 종류 | 예시 | End 기준 |
| --- | --- | --- |
| 즉시 상태 변경 | `change_expression`, `set_state`, `move_character` | DOM/state 반영이 끝난 시점 |
| 대사 출력 시작 | `speak`, `speak_text`, `speak_script` | Dialogue Player에 재생 요청을 넘긴 시점 |
| 외부 기능 호출 | `call_plugin` | `plugin.execute()`가 resolve되고 결과 출력 요청이 시작된 시점 |
| 저장/조회 | `save_data`, `load_data` | `StorageAdapter` 작업이 끝난 시점 |
| 예약 실행 | `start_timer` | timer 등록이 끝난 시점 |
| 브라우저 위임 | `navigate`, `play_sound`, `show_notification` | 브라우저 API에 요청을 넘긴 시점 |
| 후속 이벤트 | `emit_event` | 이벤트를 발행한 시점 |

## 개발자 책임과 GhostNest 책임

외부 기능을 연결할 때 책임 경계는 다음과 같다.

```txt
메뉴 클릭
-> GhostNest가 actions[] 실행
-> call_plugin
-> 개발자가 제공한 execute() 호출
-> 개발자 코드가 AI/API/DB 처리
-> GhostNest가 이해하는 결과 반환
-> GhostNest가 말풍선, 표정, script로 표현
```

개발자 책임:

- API, DB, AI 호출 구현
- 인증, 요청 파라미터, 에러 처리 정책
- 외부 결과를 GhostNest가 이해하는 값으로 변환
- 필요하면 후속 액션 배열 구성

GhostNest 책임:

- 언제 액션을 실행할지 결정
- 등록된 plugin/adapter/action handler 호출
- 결과를 대사, 표정, UI, 저장, 애니메이션으로 반영
- 액션 배열을 순서대로 실행

GhostNest는 AI prompt, DB query, API 인증 방식을 알지 않는다.

## 외부 결과 뒤에 후속 액션 연결하기

개발자는 외부 결과를 받은 뒤 추가 행동을 이어붙일 수 있다.

가장 단순한 방식은 메뉴나 rule의 `actions[]`에 순서대로 넣는 것이다.

```ts
actions: [
  { type: "call_plugin", pluginId: "ai_summary" },
  { type: "play_animation", animation: "jump", duration: 460 },
]
```

이 경우 `call_plugin`은 `plugin.execute()` 완료를 기다린 뒤 다음 액션으로 넘어간다. 하지만 plugin 결과로 시작된 대사 재생이 완전히 끝날 때까지 기다리지는 않는다.

대사와 애니메이션 타이밍을 더 명확히 하고 싶으면 plugin 결과에 `script`를 반환한다.

```ts
return {
  title: "AI 요약",
  message: summaryText,
  expression: "thinking",
  script: [
    { type: "text", value: "요약해봤어요." },
    { type: "wait", ms: 500 },
    { type: "newline" },
    { type: "text", value: summaryText },
    { type: "end" },
  ],
};
```

그리고 별도 후속 액션은 timer나 custom action으로 분리한다.

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

## custom action에서 후속 액션 실행하기

공통 액션만으로 표현하기 어려운 기능은 `registerAction`으로 얇은 custom action을 등록할 수 있다.

custom action은 외부 기능 구현을 GhostNest 내부에 넣기 위한 통로가 아니다. 이미 존재하는 외부 기능의 결과를 GhostNest 액션으로 번역하는 얇은 연결부로 사용한다.

```ts
runtime.registerAction("ai_say_and_jump", async (action, context) => {
  const result = await externalAiService.ask(String(action.prompt ?? ""));

  await context.runActions([
    { type: "change_expression", expression: "thinking" },
    { type: "speak_text", text: result.answer },
    { type: "play_animation", animation: "jump", duration: 460 },
  ]);
});
```

이 방식의 장점:

- 외부 AI/DB/API 구현은 개발자 영역에 남는다.
- GhostNest에는 결과를 어떤 액션으로 표현할지만 전달한다.
- 여러 기본 액션을 하나의 의미 있는 기능으로 묶을 수 있다.

주의점:

- `speak_text`는 대사 재생 완료까지 기다리지 않는다.
- 정확한 연출 타이밍이 필요하면 `speak_script`, `wait`, `start_timer`, 후속 이벤트를 함께 사용한다.
- 너무 많은 서비스 로직을 custom action 안에 넣으면 다시 코어와 서비스가 섞인다.

## 액션별 비동기 성격

| 액션 | 비동기 성격 | 개발자 구현 필요 |
| --- | --- | --- |
| `speak`, `speak_text`, `speak_script` | 대사 재생 요청 후 종료 | 대사/Script 데이터 |
| `call_plugin` | plugin 완료를 기다림 | 등록된 `RuntimePlugin.execute()` |
| `save_data`, `load_data` | storage 작업을 기다림 | custom storage를 쓰면 `StorageAdapter` |
| `start_timer` | 예약만 하고 종료 | 후속 `actions[]` |
| `emit_event` | 이벤트 발행 후 종료 | 해당 이벤트를 받는 rule |
| `play_animation`, `play_layer_animation` | 애니메이션 시작 후 종료 | 애니메이션 이름/레이어 데이터 |
| `open_ui`, `close_ui` | DOM 반영 후 종료 | 대상 `data-runtime-ui` 또는 selector |
| `navigate`, `play_sound`, `show_notification` | 브라우저에 위임 | 경로, 사운드, 알림 내용 |

## 판단 기준

새 기능을 액션으로 연결할 때는 다음 질문을 먼저 확인한다.

1. 이 기능의 start는 어디인가?
2. GhostNest가 끝났다고 판단할 end는 어디인가?
3. 외부 구현은 개발자 코드에 남아 있는가?
4. 결과는 기본 액션 조합으로 표현 가능한가?
5. 후속 액션이 필요하다면 순차 실행, timer, event 중 무엇이 맞는가?
6. 대사 완료까지 기다려야 하는가, 재생 시작만으로 충분한가?

이 기준을 통과하면 기능은 GhostNest 코어에 직접 박지 않고도 액션 매핑으로 연결할 수 있다.
