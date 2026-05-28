# GhostNest Runtime Rules

GhostNest 런타임은 다음 흐름을 기준으로 동작한다.

```txt
event -> rule -> action -> runtime/plugin/adapter -> character output
```

## Event

클릭, 우클릭, hover, idle, 외부 호출 같은 입력이다.

## Rule

이벤트가 발생했을 때 조건을 확인하고 액션 배열을 실행한다.

## Action

나니카가 수행하는 공통 명령이다.

액션은 가능한 작고 조합 가능해야 한다.

## Plugin

외부 기능 실행 경계다.

API, DB, AI, 게임, 상점 같은 기능은 런타임 코어가 아니라 plugin 또는 adapter로 감싼다.

## Output

최종 결과는 대사, 표정, surface, layer animation, 메뉴, UI, 알림 등으로 표현한다.

## 원칙

- 외부 기능은 core/runtime에 직접 넣지 않는다.
- 새로운 행동이 여러 곳에서 재사용될 수 있으면 RuntimeAction 후보로 본다.
- 특정 서비스 의존성이 있으면 RuntimePlugin 후보로 본다.
- 대사 생성 방식은 DialogueEngine으로 분리한다.
- 저장소는 StorageAdapter로 분리한다.
