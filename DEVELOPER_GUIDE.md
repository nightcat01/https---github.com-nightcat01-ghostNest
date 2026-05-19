# GhostNest 개발자 및 관리자 가이드 (Developer & Admin Guide)

GhostNest는 모듈화와 확장성에 초점을 맞춘 웹 기반 우카가카(나니카/고스트) 런타임 엔진입니다. 
핵심 엔진의 기본 기능 명세부터 외부 API(AI 연동), 외부 DB, 플러그인을 쉽게 붙이는 방법까지 상세히 안내합니다.

---

## 🏗️ 1. 아키텍처 개요

GhostNest는 크게 3가지 계층으로 나뉩니다.
1. **Core 계층:** `eventBus`, `dialogueEngine`, `storageAdapter`, `eventBridge` 등 논리 구조를 담당.
2. **Runtime 계층 (`createGhostRuntime`):** 이벤트를 감지하고 정의된 규칙(Rule)에 따라 액션(Action)을 실행하는 중앙 제어 시스템.
3. **UI / DOM 계층:** HTML/CSS 뷰와 연동하여 캐릭터(스프라이트)와 말풍선을 렌더링.

---

## ⚙️ 2. 상세 런타임 기능 및 설정 (Core Features)

런타임은 `GhostRuntimeOptions`를 통해 세밀하게 제어할 수 있습니다.

### 2.1. 캐릭터 정의 (Character Definition)
고스트의 성격, 외형, 대사를 정의합니다.
- `profile`: 캐릭터의 고유 ID, 이름, 기본 표정 등을 설정합니다.
- `lines`: 각 카테고리(`onClick`, `onIdle`, `onRandomPrompt` 등)에 해당하는 기본 정적 대사 배열입니다.
- `assets`: `neutral`, `happy`, `surprised` 등의 상태에 따른 스프라이트 이미지 경로 매핑을 담당합니다.

### 2.2. 이벤트와 규칙 시스템 (Event & Rule System)
GhostNest는 `이벤트 발생 -> 조건 검사 -> 액션 실행` 의 Rule-based 구조로 움직입니다.
- **주요 이벤트:** `runtime:ready`, `character:click`, `character:double_click`, `area:hover`, `character:idle`, `character:randomPrompt`
- **조건 (Conditions):** 
  - `cooldown`: 특정 액션이 너무 자주 발생하지 않도록 쿨다운 시간을 적용합니다.
  - `mode_is`: 캐릭터가 특정 상태(idle, talking 등)일 때만 동작하도록 제한합니다.
- **액션 (Actions):** 
  - `speak`, `speak_text`: 말풍선에 대사를 출력 (타이핑 효과 기본 적용)
  - `change_expression`: 캐릭터의 표정 및 이미지 에셋 변경
  - `play_animation`: 지정된 CSS 애니메이션(예: `jump`)을 일정 시간 동안 실행
  - `play_sound`: 오디오 재생
  - `open_management_menu`: 더블 클릭 시 나타나는 뎁스(Depth) 구조의 관리 메뉴 렌더링
  - `move_character`: 화면 내에서 캐릭터 위치 이동

### 2.3. 타이머 및 타이핑 효과 설정
- `timing`: `idleDelay`(방치 판정 시간), `randomPromptChance`(혼잣말 확률) 등을 초 단위로 조정할 수 있습니다.
- `typing`: 말풍선에 글자가 출력되는 속도(`interval`)를 조절하거나 타이핑 효과를 끄고 한 번에 출력되게 할 수 있습니다.

---

## 🚀 3. 플러그인(Plugin) 개발 및 비동기 처리

GhostNest의 플러그인 시스템은 **비동기(Promise)**를 완벽하게 지원합니다. 런타임은 비동기 작업이 끝날 때까지 캐릭터 표정을 'thinking' 상태로 유지하며 로딩을 시각적으로 처리합니다.

```typescript
import type { RuntimePlugin } from "../core/types.js";

export const aiDialoguePlugin: RuntimePlugin = {
  id: "ai_dialogue",
  name: "AI 대화 생성",
  execute: async () => {
    // 비동기 작업 처리 
    const response = await fetch("https://api.example.com/generate");
    const data = await response.json();

    return {
      title: "AI의 답변",
      message: data.text,
      expression: data.emotion // 'happy', 'surprised' 등
    };
  }
};
```

---

## 🧠 4. SHIORI (대화 엔진) 커스텀 (DialogueEngine)

기본적으로 정적 배열에서 대사를 뽑아오는 `StaticDialogueEngine`을 사용하지만, AI 모델 연동을 위해 `DialogueEngine` 인터페이스를 직접 구현하여 주입할 수 있습니다.

```typescript
const customDialogueEngine: DialogueEngine = {
  line: async (category) => {
    const text = await getDialogueFromAI(category); // 컨텍스트 기반 AI 대사 생성
    return { speaker: "커스텀 봇", text };
  },
  custom: async (text) => {
    return { speaker: "커스텀 봇", text };
  }
};

// 런타임 생성 시 주입
createGhostRuntime({
  // ...
  dialogueEngine: customDialogueEngine
});
```

---

## 💾 5. 외부 DB 연동 (StorageAdapter)

런타임 상태 데이터(호감도, 유저 설정 등)는 기본적으로 브라우저 `localStorage`에 저장됩니다. 이를 Firebase나 Supabase 등으로 바꾸려면 `StorageAdapter`를 구현하세요.

```typescript
const firebaseStorageAdapter: StorageAdapter = {
  get: async (key) => await fetchFromFirebase(key),
  set: async (key, value) => await saveToFirebase(key, value),
  remove: async (key) => await deleteFromFirebase(key)
};
```

---

## 🌐 6. 외부 이벤트 브리지 (SSTP 대체)

다른 탭, 부모 Iframe, 웹 확장 프로그램에서 고스트를 조종하고 싶다면 `window.postMessage`를 활용합니다. (예: 이메일 수신 알림, 트위치 채팅 알림 등)

**외부 시스템에서 이벤트 전송:**
```javascript
window.postMessage({
  type: "ghostnest:command",
  action: "call_plugin", // 내부 이벤트 버스명
  payload: { pluginId: "ai_dialogue" }
}, "*");
```

---

## 📝 7. 관리자 모드 및 상태 모니터링 (디버깅)

DOM 상에 특정 데이터 속성(`[data-runtime-ui]`, `#statusMode`, `#statusIdleCountdown` 등)을 할당해 두면 런타임 내부의 폴링 타이머가 해당 요소들에 현재 상태를 실시간으로 텍스트 렌더링합니다.
- 활용: 캐릭터의 남은 방치 시간, 랜덤 대사 확률 진행도, 활성화된 액션 타이머 수, 마지막 발생 이벤트 로그 등을 모니터링할 수 있어 복잡한 조건(Rule)을 디버깅할 때 필수적입니다.
