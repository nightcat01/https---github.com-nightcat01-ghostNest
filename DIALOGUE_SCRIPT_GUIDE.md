# Dialogue Script Guide

## 목적

GhostNest의 대사 연출 공식 포맷은 문자열이 아니라 JSON 형태의 `DialogueScript`입니다.

이 포맷은 AI, DB, API, 플러그인이 직접 생성하거나 저장하기 쉽도록 설계합니다. SakuraScript 문자열은 공식 저장 포맷이 아니라, 기존 문법이나 짧은 수기 입력을 `DialogueScript`로 변환하기 위한 선택적 어댑터입니다.

## 공식 포맷

```ts
type DialogueScript = DialogueToken[];

type DialogueToken =
  | { type: "text"; value: string }
  | { type: "wait"; ms: number }
  | { type: "surface"; id: string }
  | { type: "clear" }
  | { type: "newline" }
  | { type: "choice"; choices: DialogueChoice[] }
  | { type: "end" };

type DialogueChoice = {
  label: string;
  actions: RuntimeAction[];
};
```

예시:

```json
[
  { "type": "surface", "id": "5" },
  { "type": "text", "value": "잠깐만요." },
  { "type": "wait", "ms": 450 },
  { "type": "newline" },
  { "type": "surface", "id": "8" },
  { "type": "text", "value": "이런 식으로 말할 수도 있어요." },
  { "type": "surface", "id": "0" },
  { "type": "end" }
]
```

## 토큰 의미

- `text`: 말풍선에 출력할 텍스트입니다. Player가 글자 단위로 출력합니다.
- `wait`: 지정한 ms만큼 대기합니다.
- `surface`: 캐릭터 surface id를 변경합니다.
- `clear`: 현재 말풍선 텍스트를 비웁니다.
- `newline`: 줄바꿈을 출력합니다.
- `choice`: 말풍선 안에 선택지를 표시하고, 선택된 항목의 actions를 실행합니다.
- `end`: 현재 대사 연출을 종료합니다.

## Runtime Action에서 사용

룰이나 메뉴에서는 `speak_script` 액션으로 JSON 대사 연출을 실행합니다.

```ts
{
  type: "speak_script",
  text: "잠깐만요. 이런 식으로 말할 수도 있어요.",
  script: [
    { type: "surface", id: "5" },
    { type: "text", value: "잠깐만요." },
    { type: "wait", ms: 450 },
    { type: "newline" },
    { type: "text", value: "이런 식으로 말할 수도 있어요." },
    { type: "end" },
  ],
}
```

`text`는 fallback 또는 요약 텍스트입니다. 실제 연출은 `script`가 담당합니다.

선택지 예시:

```ts
{
  type: "choice",
  choices: [
    {
      label: "상점 열기",
      actions: [{ type: "open_ui", target: "shop" }],
    },
    {
      label: "괜찮아",
      actions: [{ type: "speak_text", text: "알겠어요." }],
    },
  ],
}
```

## Plugin에서 사용

AI, DB, API 플러그인은 `PluginResult.script`를 반환할 수 있습니다.

```ts
return {
  title: "AI 응답",
  message: "안녕. 잠깐 생각했어.",
  expression: "thinking",
  script: [
    { type: "text", value: "안녕." },
    { type: "wait", ms: 500 },
    { type: "text", value: "잠깐 생각했어." },
    { type: "end" },
  ],
};
```

`script`가 있으면 Dialogue Player가 토큰을 실행합니다. `script`가 없으면 기존처럼 `title + message`를 일반 텍스트로 출력합니다.

## SakuraScript 변환기

SakuraScript 문자열은 `parseSakuraScript()`로 `DialogueScript`로 변환할 수 있습니다.

```ts
import { parseSakuraScript } from "./core/sakuraScriptParser.js";

const script = parseSakuraScript("\\s[5]안녕.\\w[500]\\n오늘도 왔네.\\e");
```

현재 지원하는 최소 문법:

```txt
\w[500]  wait 500ms
\w8      wait 400ms
\s[5]    surface id 5
\c       clear
\n       newline
\e       end
```

SakuraScript는 편의 입력 또는 호환용입니다. AI/DB 저장과 교환은 `DialogueScript` JSON을 우선 사용합니다.

## Surface 연결

`surface` 토큰은 캐릭터 assets의 `surfaces` 매핑을 사용합니다.

```ts
assets: {
  surfaces: {
    "0": { id: "0", image: "./default.png" },
    "5": { id: "5", image: "./thinking.png" },
  },
}
```

없는 surface id가 들어오면 런타임은 `ghostnest:surface-missing` 이벤트를 발행하고 현재 이미지를 유지합니다.

## 클릭 스킵

`DialogueScript` 재생 중 캐릭터를 클릭하면 현재 타이핑 또는 대기 구간을 스킵합니다.

재생 중이 아닐 때는 기존 클릭/터치 이벤트가 그대로 동작합니다.

## 웹 런타임 검증 기준

런타임은 재생 직전에 `validateDialogueScript()`로 JSON 구조를 검사합니다.

오류가 있으면 일반 텍스트 fallback으로 출력하고, 경고는 console에 남깁니다.

기본 권장 기준:

- 토큰 수: 80개 이하
- 텍스트 총 길이: 2,000자 이하
- surface 변경: 8회 이하
- wait: 16ms 이상, 30,000ms 이하
- 가능하면 `end` 토큰 포함

검사 항목:

- 알 수 없는 token type
- 필수 필드 누락
- 잘못된 `wait.ms`
- 비어 있는 `surface.id`
- 잘못된 `choice.choices`
- 캐릭터 assets에 없는 surface id
- 과도한 토큰 수, 텍스트 길이, surface 변경 횟수
