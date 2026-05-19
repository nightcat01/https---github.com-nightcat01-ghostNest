# GhostNest Project Compass

## 목적

GhostNest의 최종 방향은 완성된 단일 나니카 캐릭터를 제공하는 것이 아니라, 웹 위에 나니카형 캐릭터를 붙이고 확장할 수 있는 런타임 솔루션을 제공하는 것이다.

따라서 프로젝트 마무리의 핵심은 캐릭터의 최종 외형이나 개별 기능 수가 아니라, 사용자와 개발자가 이 솔루션을 어떻게 이해하고 사용하는지에 있다.

개발자 관점에서는 특히 다음 원칙이 중요하다.

> 개발자는 내부 런타임을 직접 고치는 사람이 아니라, 나니카와 외부 기능을 연결하는 매핑을 작성하는 사람이어야 한다.

## 핵심 방향

GhostNest는 `event -> rule -> action` 구조를 중심으로 동작한다.

- 이벤트는 사용자의 입력이나 런타임 상태 변화다.
- 룰은 특정 이벤트가 발생했을 때 어떤 조건에서 반응할지 정의한다.
- 액션은 나니카가 실제로 수행하는 표준 명령이다.

개발자가 고민해야 할 것은 내부 실행 방식이 아니라 다음 세 가지다.

1. 어떤 상황에서 실행할 것인가
2. 어떤 API, DB, AI, UI, 플러그인을 연결할 것인가
3. 결과를 나니카가 어떤 방식으로 표현할 것인가

## 개발자 사용 모델

개발자의 이상적인 작업 표면은 하나의 매핑이어야 한다.

```ts
createGhostRuntime({
  character,
  plugins,
  dialogueEngine,
  storageAdapter,
  rules,
});
```

이 중 개발자가 주로 만지는 영역은 `rules` 또는 향후 별도화될 `actionMap`이다.

예상 사용 형태는 다음과 같다.

```ts
rules: [
  {
    id: "character.click.jump",
    event: "character:click",
    actions: [
      { type: "play_animation", animation: "jump" },
      { type: "speak", category: "onClick" },
    ],
  },
  {
    id: "character.right_click.menu",
    event: "character:right_click",
    actions: [
      {
        type: "open_management_menu",
        title: "Menu",
        items: [
          {
            id: "shop",
            label: "Open shop",
            actions: [{ type: "open_ui", target: "shop" }],
          },
          {
            id: "clothes",
            label: "Change clothes",
            children: [
              {
                id: "black-dress",
                label: "Black dress",
                actions: [{ type: "call_plugin", pluginId: "change_clothes_black" }],
              },
            ],
          },
        ],
      },
    ],
  },
]
```

이 구조에서 클릭, 우클릭, 메뉴 depth, 기능 실행은 모두 같은 액션 문법으로 연결된다.

## 액션의 역할

`RuntimeAction`은 GhostNest 런타임의 공통 언어다.

개별 서비스가 달라져도 나니카가 수행하는 행동은 다음과 같은 표준 액션으로 표현되어야 한다.

- 말하기: `speak`, `speak_text`
- 표정과 상태 변경: `change_expression`, `set_state`, `set_touched_part`
- UI 제어: `open_ui`, `close_ui`, `open_management_menu`, `close_management_menu`
- 외부 기능 호출: `call_plugin`
- 이동과 출력: `navigate`, `show_notification`, `play_sound`, `play_animation`
- 저장과 조회: `save_data`, `load_data`
- 흐름 제어: `emit_event`, `start_timer`, `stop_timer`, `touch_interaction`, `mark_prompted`

개발자는 이 액션들을 조합해서 기능을 만든다. 런타임 내부를 수정해서 새 기능을 직접 끼워 넣는 방식은 마지막 수단이어야 한다.

## 외부 연결의 경계

API, DB, AI 연결은 런타임 안에 직접 섞이지 않아야 한다.

각 연결 지점은 다음 경계로 분리한다.

- API 호출, 결제, 상점, 의상 변경, 미니게임: `RuntimePlugin`
- 대사 생성, AI 응답, 캐릭터 말투 제어: `DialogueEngine`
- 저장소, 사용자 데이터, 원격 DB: `StorageAdapter`
- 외부 앱 또는 iframe 제어: `eventBridge`

이 경계가 유지되면 개발자는 외부 시스템을 바꿔도 나니카 런타임의 핵심 코드를 건드리지 않아도 된다.

## 메뉴 설계 원칙

우클릭 메뉴와 depth 메뉴도 별도 예외 시스템이 아니라 액션 시스템의 일부여야 한다.

예를 들어 다음 흐름이 모두 같은 구조로 표현되어야 한다.

- 클릭했을 때 나니카가 뛴다.
- 우클릭하면 메뉴가 열린다.
- 메뉴 depth를 따라 들어간다.
- 특정 항목을 누르면 사이트 이동, 상점 열기, 옷 변경, AI 호출 등이 실행된다.

메뉴 항목은 `ManagementMenuItem`으로 표현하고, 실제 실행은 항상 `actions` 배열에 위임한다.

## 모듈화 기준

프로젝트가 커질수록 다음 기준을 지켜야 한다.

- 공통 행동은 액션으로 만든다.
- 외부 기능은 플러그인으로 감싼다.
- 저장 방식은 스토리지 어댑터로 분리한다.
- 대사 생성 방식은 대화 엔진으로 분리한다.
- 기본 룰과 예시 룰은 런타임 내부에서 점차 분리한다.
- 캐릭터별 데이터, 이미지, 대사는 캐릭터 모듈에 둔다.

중복 구현보다 공통 액션과 어댑터를 우선 검토한다.

## 마무리 우선순위

프로젝트 마무리는 다음 순서로 진행하는 것이 좋다.

1. 깨진 인코딩 문자열과 문서를 정리한다.
2. 지원 액션 목록을 공식 액션 카탈로그로 정리한다.
3. 기본 rule과 기본 메뉴를 preset 형태로 분리한다.
4. 개발자가 수정할 예시 매핑 파일을 제공한다.
5. API, DB, AI 연결 예제를 각각 plugin, storageAdapter, dialogueEngine 기준으로 정리한다.
6. README보다 개발자 가이드를 우선 정리해서 첫 진입 경험을 안정화한다.

## 판단 기준

새 기능을 넣을 때는 다음 질문으로 판단한다.

- 이 기능은 모든 나니카가 쓸 수 있는 공통 행동인가?
  - 그렇다면 `RuntimeAction` 후보로 본다.
- 특정 서비스나 외부 시스템에 의존하는가?
  - 그렇다면 `RuntimePlugin` 후보로 본다.
- 대사 생성 방식의 문제인가?
  - 그렇다면 `DialogueEngine`으로 분리한다.
- 데이터 저장 위치의 문제인가?
  - 그렇다면 `StorageAdapter`로 분리한다.
- 단순히 어떤 상황에서 무엇을 실행할지의 문제인가?
  - 그렇다면 rule/action 매핑으로 해결한다.

## 최종 한 줄

GhostNest의 완성도는 나니카가 얼마나 많은 기능을 직접 품고 있는지가 아니라, 개발자가 얼마나 적은 표면만 만지고도 원하는 API, DB, AI, UI를 나니카의 행동으로 연결할 수 있는지로 판단한다.
