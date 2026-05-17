# GhostNest

웹 기반 AI 캐릭터 런타임을 실험하기 위한 TypeScript MVP입니다.

## 현재 범위

- 캐릭터 표시
- 말풍선 출력
- 캐릭터 부위별 클릭 반응
- 화면 관찰 영역 hover/focus 반응
- idle 이벤트와 랜덤 발화
- 캐릭터 프로필과 대사 데이터 분리
- 더미 운세 플러그인 호출
- 외부에서 호출 가능한 `createGhostRuntime()` API

## 실행

의존성을 설치한 뒤 TypeScript를 빌드합니다.

```bash
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

브라우저에서 `http://127.0.0.1:4173`을 열면 됩니다.

## 사용 예시

```ts
import { rine } from "./characters/rine/index.js";
import { fortunePlugin } from "./plugins/fortune/index.js";
import { createGhostRuntime } from "./runtime/createGhostRuntime.js";

createGhostRuntime({
  character: rine,
  plugins: [fortunePlugin],
  selectors: {
    stage: "#characterStage",
    sprite: "#characterSprite",
    spriteImage: "#characterSpriteImage",
    speakerName: "#speakerName",
    speechText: "#speechText",
    balloonActionMenu: "#balloonActionMenu",
    eventLog: "#eventLog",
    menuButtons: "[data-command]",
    observeAreas: "[data-observe-area]",
    statusMode: "#statusMode",
    statusExpression: "#statusExpression",
    statusVisibility: "#statusVisibility",
    statusLastEvent: "#statusLastEvent",
    statusIdleCountdown: "#statusIdleCountdown",
    statusRandomPrompt: "#statusRandomPrompt",
    statusActionTimers: "#statusActionTimers",
  },
  features: {
    commandHoverDescription: true,
  },
  typing: {
    enabled: true,
    interval: 26,
  },
  spriteSize: {
    desktopWidth: "260px",
    desktopHeight: "390px",
    mobileWidth: "170px",
    mobileHeight: "255px",
  },
});
```

## 구조

```txt
src/
  app.ts
  runtime/
    createGhostRuntime.ts
  characters/
    rine/
      index.ts
      profile.ts
      lines.ts
    mira/
      index.ts
      profile.ts
      lines.ts
  core/
    dialogueEngine.ts
    eventBus.ts
    hitTest.ts
    runtimeState.ts
    types.ts
  plugins/
    fortune/
      index.ts
```

`app.ts`는 데모 진입점이고, 실제 런타임 조립은 `createGhostRuntime()`이 담당합니다.

캐릭터 이미지는 표정별 단일 이미지 또는 이미지 배열로 등록할 수 있습니다. 배열이면 해당 표정이 표시될 때 후보 중 하나를 랜덤으로 선택합니다.

대사는 기본적으로 한 글자씩 타이핑됩니다. `typing.enabled`를 `false`로 두면 즉시 출력으로 되돌릴 수 있고, `typing.interval`로 글자 출력 간격을 조절합니다.

## 지원 액션

현재 `RuntimeAction`은 다음 범용 액션을 지원합니다.

```txt
speak
speak_text
change_expression
set_touched_part
toggle_hidden
call_plugin
log
touch_interaction
mark_prompted
play_animation
open_ui
close_ui
navigate
set_state
emit_event
play_sound
save_data
load_data
show_notification
start_timer
stop_timer
move_character
change_balloon
```

## Rule 예시

런타임은 `event -> conditions -> actions` 규칙을 받을 수 있습니다.

```ts
rules: [
  {
    id: "custom.head.touch",
    event: "character:touch",
    when: { part: "head" },
    conditions: [{ type: "not_hidden" }],
    actions: [
      { type: "change_expression", expression: "happy" },
      { type: "speak_text", text: "머리를 쓰다듬으셨네요." },
      { type: "log", label: "custom.head.touch" },
    ],
  },
]
```

기본 동작으로 캐릭터를 더블클릭하면 말풍선 안에 관리 메뉴가 열립니다. 이 메뉴는 `character:double_click` rule과 `open_management_menu` 액션으로 구성되어 있습니다.

관리 메뉴 항목은 `children`을 가질 수 있어 depth 메뉴를 만들 수 있습니다. 현재 기본 메뉴의 `말풍선 테마`는 하위 메뉴에서 `기본`, `soft`, `dark magic`을 선택합니다.

## 액션별 현재 구현 예시

아래 예시는 현재 소스 기준으로 바로 `rules[].actions`에 넣을 수 있는 형태입니다.

### speak

캐릭터 대사 카테고리에서 랜덤 대사를 출력합니다.

```ts
{ type: "speak", category: "onTouchHead" }
```

현재 기본 rule에서는 머리/얼굴/몸 터치, hover 설명, idle, 랜덤 발화에 사용합니다.

### speak_text

고정 문장을 그대로 말풍선에 출력합니다.

```ts
{ type: "speak_text", text: "여기는 직접 지정한 안내 문장이에요." }
```

DB나 AI 응답 텍스트를 나중에 붙일 때 가장 단순한 출력 액션으로 쓸 수 있습니다.

### change_expression

캐릭터 표정을 변경하고, 등록된 이미지 후보 중 하나를 표시합니다.

```ts
{ type: "change_expression", expression: "thinking", clearTouchedPart: true }
```

리네는 `happy`, `thinking`, `surprised`에 여러 이미지 후보가 등록되어 있어 같은 표정도 랜덤하게 바뀔 수 있습니다.

### set_touched_part

마지막으로 반응한 캐릭터 부위를 기록합니다.

```ts
{ type: "set_touched_part", part: "head" }
```

현재는 CSS의 `data-touched-part` 변화에 사용합니다.

### toggle_hidden

캐릭터 스테이지의 숨김 상태를 토글합니다.

```ts
{ type: "toggle_hidden" }
```

현재 `command:hide`는 상태별 대사가 필요해서 직접 분기로 남아 있지만, 액션 자체는 실행기에서 지원합니다.

### call_plugin

등록된 플러그인을 `pluginId`로 찾아 실행합니다.

```ts
{ type: "call_plugin", pluginId: "fortune" }
```

현재 `fortunePlugin`은 `plugins: [fortunePlugin]`로 등록되며, 결과의 `title`, `message`, `expression`을 말풍선과 표정에 반영합니다.

### log

이벤트 로그에 문자열을 추가합니다.

```ts
{ type: "log", label: "custom.head.touch" }
```

디버깅과 rule 실행 확인용으로 사용합니다.

### touch_interaction

마지막 사용자 상호작용 시간을 갱신합니다.

```ts
{ type: "touch_interaction" }
```

idle, 랜덤 발화 타이밍을 밀어내는 데 사용합니다.

### mark_prompted

마지막 랜덤 발화 시각을 갱신합니다.

```ts
{ type: "mark_prompted" }
```

현재 `character:randomPrompt` 기본 rule에서 사용합니다.

### play_animation

캐릭터 sprite에 `data-animation`을 설정합니다.

```ts
{ type: "play_animation", animation: "wave_hand", duration: 520 }
```

현재 CSS에는 `wave_hand`, `jump`, `nod` 예시 애니메이션이 있습니다.

### open_ui

`data-runtime-ui`가 일치하는 UI 요소를 엽니다.

```ts
{ type: "open_ui", target: "fortune_modal" }
```

HTML에 아래처럼 대상이 있어야 합니다.

```html
<section data-runtime-ui="fortune_modal" hidden>...</section>
```

### close_ui

`data-runtime-ui`가 일치하는 UI 요소를 닫습니다.

```ts
{ type: "close_ui", target: "fortune_modal" }
```

### navigate

지정한 경로로 이동합니다.

```ts
{ type: "navigate", route: "/tarot" }
```

현재 구현은 `window.location.assign(route)`를 사용합니다.

### set_state

캐릭터 런타임 상태를 변경합니다.

```ts
{ type: "set_state", state: "service_active" }
```

상태는 `state.mode`와 스테이지의 `data-state`에 반영됩니다.

### emit_event

다른 런타임 이벤트를 발생시킵니다.

```ts
{ type: "emit_event", event: "character:idle" }
```

이벤트를 조합하거나 후속 rule을 실행할 때 사용할 수 있습니다.

### play_sound

지정한 사운드 파일을 재생합니다.

```ts
{ type: "play_sound", sound: "./assets/sounds/magic_click.mp3", volume: 0.5 }
```

브라우저 정책상 사용자 제스처 없이 재생이 막힐 수 있습니다.

### save_data

캐릭터별 localStorage에 데이터를 저장합니다.

```ts
{ type: "save_data", key: "last_fortune_result", value: "great_luck" }
```

저장 키는 내부적으로 `ghostNest:{characterId}:{key}` 형식이 됩니다.

### load_data

캐릭터별 localStorage에서 데이터를 불러옵니다.

```ts
{ type: "load_data", key: "last_fortune_result", speak: true }
```

`speak: true`이면 불러온 값을 말풍선으로 출력합니다.

### show_notification

알림을 표시합니다.

```ts
{ type: "show_notification", title: "오늘의 운세", message: "새 결과가 도착했어요." }
```

브라우저 알림 권한이 있으면 Notification을 사용하고, 아니면 말풍선으로 출력합니다.

### start_timer

일정 시간 뒤 액션 배열을 실행하는 타이머를 시작합니다.

```ts
{
  type: "start_timer",
  timer: "delayed_hint",
  duration: 3000,
  actions: [
    { type: "speak_text", text: "3초 뒤에 나온 안내예요." },
    { type: "log", label: "timer.delayed_hint" },
  ],
}
```

같은 이름의 타이머가 이미 있으면 기존 타이머를 취소하고 새로 시작합니다.

### stop_timer

실행 대기 중인 타이머를 취소합니다.

```ts
{ type: "stop_timer", timer: "delayed_hint" }
```

### move_character

캐릭터 스테이지 위치를 직접 지정합니다.

```ts
{ type: "move_character", x: 40, y: 120 }
```

현재는 스테이지에 CSS 변수와 `data-position-mode="custom"`을 적용합니다.

### change_balloon

말풍선 테마를 변경합니다.

```ts
{ type: "change_balloon", theme: "dark_magic" }
```

현재 CSS에는 `dark_magic`, `soft` 테마 예시가 있습니다.
