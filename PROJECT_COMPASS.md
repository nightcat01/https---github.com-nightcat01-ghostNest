# GhostNest Project Compass

## 목표

GhostNest의 목표는 완성된 하나의 나니카 캐릭터를 만드는 것이 아니다.

GhostNest는 개발자가 API, DB, AI, UI, 플러그인 같은 외부 기능을 **액션에 매핑**하면, 그 결과를 나니카다운 방식으로 표현해주는 웹 런타임이다.

쉽게 말하면 GhostNest는 기능 자체를 전부 품은 본체라기보다, 기능을 캐릭터 행동으로 연결해주는 **껍데기이자 실행 환경**이다.

개발자는 코어 런타임이나 내부 라이브러리를 크게 수정하지 않고, 다음 정도만 고민하면 되어야 한다.

1. 어떤 상황에서 실행할 것인가
2. 어떤 API, DB, AI, UI, 플러그인을 연결할 것인가
3. 결과를 어떤 액션과 대사로 표현할 것인가

이 기준이 지켜지면 기능이 늘어나도 GhostNest는 복잡한 앱 본체가 아니라, 계속 재사용 가능한 나니카형 웹 런타임으로 남을 수 있다.

## 핵심 원칙

개발자는 나니카의 내부를 고치는 사람이 아니라, 나니카와 외부 기능을 연결하는 사람이어야 한다.

따라서 기능 추가의 기본 방향은 다음과 같다.

- 공통 동작은 `RuntimeAction`으로 만든다.
- 특정 서비스 연동은 `RuntimePlugin`으로 감싼다.
- 대사 생성 방식은 `DialogueEngine`으로 분리한다.
- 저장소와 사용자 데이터는 `StorageAdapter`로 분리한다.
- 실행 순서는 `event -> rule -> action` 매핑으로 표현한다.
- 캐릭터 이미지, 표정, 레이어, 히트박스는 캐릭터 모듈 데이터로 둔다.

코어를 직접 수정해야만 기능이 붙는다면 아직 구조가 덜 분리된 것이다.

## 확장 표면 원칙

GhostNest에서 확장성은 특정 기능 하나에만 적용되는 원칙이 아니다.

캐릭터 레이어, 메뉴, 대사, 플러그인, UI, 저장소, 이벤트, 타이머는 모두 같은 방향을 가져야 한다.

> 기능은 코어에 박아 넣는 것이 아니라, 등록 가능한 모듈과 매핑 가능한 액션으로 연결한다.

따라서 개발자가 새 기능을 붙일 때의 기본 흐름은 다음과 같아야 한다.

```txt
만들고 싶은 기능 정의
-> 필요한 모듈 등록
-> 어떤 이벤트나 메뉴에서 실행할지 rule/action으로 매핑
-> 결과를 대사, 표정, 레이어, UI, 알림 등으로 표현
```

등록 가능한 표면은 점진적으로 다음 방향을 가진다.

- `registerAction`: 새 행동 명령을 등록한다.
- `plugins`: 외부 API, DB, AI, 게임, 상점 같은 기능을 등록한다.
- `dialogueEngine`: 대사 생성 방식을 교체한다.
- `storageAdapter`: 저장소를 교체한다.
- `rules`: 이벤트와 액션 실행 흐름을 연결한다.
- `character.assets.surfaces.layers`: 캐릭터 이미지와 파츠 세트를 등록한다.
- `ManagementMenuItem`: 메뉴 depth와 메뉴 항목 실행을 액션에 연결한다.
- `eventBridge`: 외부 앱이나 iframe에서 런타임 이벤트를 호출한다.

앞으로 새 기능을 만들 때는 먼저 다음 질문을 한다.

1. 이 기능은 이미 있는 액션 조합으로 표현 가능한가?
2. 새 액션이 필요하다면 다른 기능에서도 재사용 가능한 최소 행동인가?
3. 외부 서비스 의존성이 있다면 플러그인으로 분리할 수 있는가?
4. 캐릭터별 차이라면 코어가 아니라 캐릭터 데이터로 표현할 수 있는가?
5. 사용자 입력, 메뉴 선택, idle, 외부 호출 중 어디에 매핑할 것인가?

이 질문을 통과하면 개발자가 해야 할 일은 "이런 기능을 만들고 싶다"와 "이 액션에 매핑하자"를 정의하는 것으로 줄어든다.

## 런타임 구조

GhostNest는 기본적으로 다음 흐름으로 동작한다.

```txt
event -> rule -> action -> runtime/plugin/adapter -> character output
```

- `event`: 클릭, 우클릭, 터치, hover, idle, 외부 호출 같은 입력이다.
- `rule`: 특정 이벤트가 발생했을 때 어떤 조건에서 반응할지 정한다.
- `action`: 실제로 수행할 최소 행동 단위다.
- `plugin`: API, DB, AI, 게임, 상점, 외부 서비스 같은 기능을 감싼다.
- `output`: 대사, 표정, 애니메이션, 말풍선, 메뉴, 알림 등 사용자에게 보이는 결과다.

이 구조에서 개발자가 주로 만지는 영역은 `rules`, `actions`, `plugins`, `dialogueEngine`, `storageAdapter`, 캐릭터 데이터다.

2차 정리 이후 개발자가 우선 바라봐야 하는 표면은 다음 3개로 좁힌다.

- `character.ts`: 누가 나오는가
- `nanika.config.ts`: 어떤 외부 연결점과 런타임 옵션을 쓰는가
- `actions.ts`: 메뉴 항목과 이벤트 rule에서 언제 무엇을 실행하는가

실제 개발자의 첫 진입 문서는 [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)로 둔다.

`src/demo`는 샘플 preset을 보관하는 영역이고, `src/ghost`는 현재 서비스가 실제로 조립하는 개발자 표면이다. 데모 기능을 보여주기 위해 `src/ghost`가 `src/demo` preset을 가져올 수는 있지만, 서비스 고유 기능은 `src/ghost`에서 교체하거나 추가하는 것을 기본 흐름으로 둔다.

`src/characters`는 캐릭터 데이터와 표현 리소스를 보관하는 영역이다. 캐릭터별 표정, surface, layer, 대사, hit area는 여기에 두고, 서비스 기능 실행 순서는 `src/ghost/actions.ts`에서 매핑한다.

빌드된 파일과 `src/runtime`, `src/core` 내부 구현은 일반적인 기능 매핑 과정에서 직접 수정하지 않는 것을 목표로 한다.

## 개발자 사용 모델

개발자가 기대하는 작업 화면은 다음과 같아야 한다.

```ts
createGhostRuntime({
  character,
  plugins,
  dialogueEngine,
  storageAdapter,
  rules,
});
```

예시:

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

클릭, 우클릭, 메뉴 depth, 사이트 이동, 상점 열기, 옷 갈아입히기, AI 호출, DB 저장 같은 기능은 모두 같은 액션 문법 위에 올라가야 한다.

## 액션의 역할

`RuntimeAction`은 GhostNest 런타임의 공통 언어다.

개별 기능이 달라도 나니카가 수행하는 행동은 가능한 한 작은 액션으로 표현한다.

- 말하기: `speak`, `speak_text`, `speak_script`
- 표정/상태 변경: `change_expression`, `set_state`, `set_touched_part`
- UI 제어: `open_ui`, `close_ui`, `open_management_menu`, `close_management_menu`, `set_management_menu_display`, `reset_runtime_ui`
- 외부 기능 호출: `call_plugin`
- 이동/출력: `navigate`, `show_notification`, `play_sound`, `play_animation`, `play_layer_animation`
- 저장/조회: `save_data`, `load_data`
- 흐름 제어: `emit_event`, `start_timer`, `stop_timer`, `touch_interaction`, `mark_prompted`

개발자는 액션을 조합해서 기능을 만든다.

코어에 새 기능을 직접 박아 넣는 방식은 마지막 선택이어야 한다. 같은 요구가 여러 캐릭터나 서비스에서 반복될 가능성이 있으면 먼저 액션화하거나 플러그인화한다.

액션을 기능과 연결할 때는 start와 end를 먼저 정한다. 외부 AI, DB, API, 사용자 입력 결과를 출력한 뒤 애니메이션이나 후속 대사를 이어붙이는 경우도 모두 `actions[]`의 순차 실행, `start_timer`, `emit_event`, custom action handler 중 하나로 표현한다.

상세 기준은 [ACTION_LIFECYCLE.md](./ACTION_LIFECYCLE.md)를 따른다.

지원 액션 목록과 사용 예시는 [ACTION_CATALOG.md](./ACTION_CATALOG.md)를 공식 카탈로그로 둔다.

## 외부 연결 경계

API, DB, AI 연결은 런타임 코어 안에 직접 들어오면 안 된다.

각 연결 지점은 다음 경계로 분리한다.

- API 호출, 결제, 상점, 의상 변경, 미니게임: `RuntimePlugin`
- 대사 생성, AI 응답, 캐릭터 말투 제어: `DialogueEngine`
- 저장소, 사용자 데이터, 원격 DB: `StorageAdapter`
- 외부 앱 또는 iframe 제어: `eventBridge`

이 경계가 유지되면 개발자는 외부 시스템을 바꿔도 나니카 런타임의 핵심 코드를 건드리지 않아도 된다.

외부 결과를 액션으로 연결하는 예시는 [EXTERNAL_RESULT_MAPPING.md](./EXTERNAL_RESULT_MAPPING.md)를 기준으로 둔다.

사용자 UI 설정도 같은 원칙을 따른다. 메뉴 표시 방식, 말풍선 테마, 글자 크기, 캐릭터 위치처럼 사용자가 고르는 값은 액션으로 변경하고, 저장은 `StorageAdapter` 경계에 맡긴다.

저장값과 사용자 설정의 key, 초기화 기준은 [STORAGE_AND_SETTINGS.md](./STORAGE_AND_SETTINGS.md)를 따른다.

코어가 특정 화면 취향을 직접 소유하지 않고, 개발자는 필요한 설정 액션을 메뉴나 rule에 매핑한다. 기본값으로 되돌리는 흐름 역시 `reset_runtime_ui` 같은 액션으로 표현한다.

말풍선, 메뉴, 패널, 캐릭터 표시를 교체할 때의 경계는 [UI_RENDERER_BOUNDARY.md](./UI_RENDERER_BOUNDARY.md)를 따른다.

## 캐릭터 표현 원칙

GhostNest는 Live2D 같은 변형 엔진을 목표로 하지 않는다.

대신 웹에서 안정적으로 구현 가능한 레이어 기반 캐릭터 표현을 제공한다.

- `surface`는 캐릭터의 큰 상태 또는 표정 단위다.
- `layers`는 `base`, `eyes`, `mouth`, `ears`, `accessory` 같은 파츠 단위다.
- 각 레이어는 자기 이미지만 바꾼다.
- 말할 때 입, idle 중 눈 깜빡임, 귀 움직임 같은 표현은 독립 파트 애니메이터로 확장한다.
- 전체 이미지 기반 리소스도 `coversBase` 같은 방식으로 호환하되, 최종 권장 구조는 투명 PNG 파츠 레이어다.

목표는 복잡한 렌더링 엔진이 아니라, 나니카다운 표현을 서비스에 방해되지 않는 수준으로 안정적으로 얹는 것이다.

캐릭터 레이어는 GhostNest 확장 표면의 대표 예시다.

현재 리네 예시는 말할 때 입모양이 바뀌는 `mouth` 레이어만 가지고 있지만, 최종 구조는 개발자가 같은 방식으로 `eyes`, `ears`, `tail`, `wing` 같은 파츠 세트를 추가할 수 있어야 한다.

예를 들어 개발자는 캐릭터 데이터에 다음과 같은 세트를 추가하고, 런타임은 그 세트를 공통 파트 애니메이터로 실행해야 한다.

```ts
layers: {
  mouth: {
    frames: ["mouth-close.png", "mouth-open.png"],
    intervalMs: 140,
  },
  eyes: {
    frames: ["eyes-open.png", "eyes-close.png"],
    intervalMs: 2600,
  },
  ears: {
    frames: ["ears-0.png", "ears-1.png", "ears-2.png"],
    intervalMs: 320,
  },
}
```

즉 입모양, 눈깜빡임, 귀 움직임은 각각 특수 기능이 아니라 같은 레이어 애니메이션 구조의 서로 다른 사용 예시여야 한다.

## 대사 표현 원칙

GhostNest의 공식 대사 연출 포맷은 JSON 기반 `DialogueScript`다.

SakuraScript 계열 문법은 호환 입력 또는 변환기로 다룬다.

이 기준은 AI, DB, API가 대사를 생성하거나 저장할 때 문자열 파싱에 의존하지 않게 하기 위한 것이다.

```ts
type DialogueToken =
  | { type: "text"; value: string }
  | { type: "wait"; ms: number }
  | { type: "surface"; id: string }
  | { type: "clear" }
  | { type: "newline" }
  | { type: "end" };
```

대사는 단순 출력이 아니라 실행 가능한 연출 데이터여야 한다.

## 메뉴 설계 원칙

우클릭 메뉴는 별도 예외 시스템이 아니라 액션 시스템의 일부다.

예를 들어 다음 흐름은 모두 같은 구조로 표현되어야 한다.

- 클릭했을 때 캐릭터가 뛴다.
- 우클릭하면 메뉴가 열린다.
- 메뉴 depth를 따라 들어간다.
- 특정 항목을 누르면 사이트 이동, 상점 열기, 옷 변경, AI 호출 등이 실행된다.

메뉴 항목은 `ManagementMenuItem`으로 표현하고, 실제 실행은 항상 `actions` 배열에 위임한다.

메뉴의 표시 방식도 메뉴 구현 내부에 고정하지 않는다. 기본 메뉴는 말풍선, 시스템 메뉴는 패널처럼 `menuId`별 표시 방식을 둘 수 있고, 사용자가 고른 값은 저장소에 남길 수 있다.

말풍선 메뉴와 패널 메뉴의 역할은 다르다.

- 말풍선 메뉴는 캐릭터 주변의 짧은 선택지와 간단한 행동에 적합하다.
- 패널 메뉴는 히트박스 에디터처럼 화면 위에 뜨는 독립 UI이며, 긴 메뉴나 시스템 설정에 적합하다.

메뉴 항목에는 `description`을 둘 수 있고, 런타임은 hover/focus 시 캐릭터가 그 기능을 설명하게 만들 수 있다. 즉 메뉴는 단순 버튼 목록이 아니라, 캐릭터가 기능을 안내하는 접점이다.

## 아직 넣지 않은 나니카 계열 기능

GhostNest는 나니카 원본 기능을 전부 복제하는 프로젝트가 아니다.

따라서 아직 넣지 않은 기능은 "빠진 기능"이라기보다, 웹 런타임에 맞는 형태로 흡수할지 판단 중인 후보로 본다.

| 기능 | 현재 상태 | 아직 넣지 않은 이유 | GhostNest에서의 수용 방향 |
| --- | --- | --- | --- |
| 완전한 SakuraScript 호환 | 부분 지원 | 전체 문법을 한 번에 지원하면 파서와 player가 커지고, AI/DB 저장용 JSON 기준이 흐려진다. | 공식 포맷은 `DialogueScript` JSON으로 유지하고, SakuraScript는 변환기/호환 입력으로 점진 확장한다. |
| SERIKO 전체 애니메이션 | 부분 지원 | 원본 수준의 애니메이션 정의를 그대로 가져오면 웹 UI와 리소스 구조가 무거워질 수 있다. | `surface.layers`와 `play_layer_animation`을 중심으로 필요한 표현만 파츠 애니메이션으로 흡수한다. |
| Shell 교체/패키지 시스템 | 미지원 | 파일 시스템 기반 shell 관리와 웹 배포 방식이 다르다. 사용자 업로드, 권한, 캐시 정책도 같이 설계해야 한다. | 캐릭터 모듈 또는 플러그인 패키지로 분리하고, 의상/스킨 변경은 우선 액션과 캐릭터 데이터 매핑으로 표현한다. |
| Balloon 스킨 전체 호환 | 부분 지원 | 원본 balloon 포맷을 그대로 해석하기보다, 웹 CSS와 접근성 기준에 맞춰야 한다. | `change_balloon`, `change_balloon_font_size`, 메뉴 표시 방식처럼 사용자 설정 액션으로 먼저 제공하고, 나중에 테마 preset으로 확장한다. |
| Sakura/Kero 다중 캐릭터 | 미지원 | 단일 캐릭터 기준의 surface, balloon, hitbox 구조가 먼저 안정되어야 한다. | speaker id, 캐릭터별 surface, balloon anchor를 도입한 뒤 확장한다. |
| SHIORI 호환 | 미지원 | GhostNest는 로컬 고스트 엔진이 아니라 웹 런타임이므로, SHIORI 프로토콜을 코어에 직접 넣으면 경계가 흐려진다. | 필요하면 `DialogueEngine` 또는 외부 adapter가 SHIORI 응답을 `DialogueScript`와 `RuntimeAction`으로 변환한다. |
| SAORI 계열 외부 함수 | 미지원 | 임의 외부 함수를 코어에서 직접 실행하면 보안, 배포, 브라우저 권한 문제가 생긴다. | 웹에서는 `RuntimePlugin`으로 감싸고, 네트워크/API 호출은 플러그인 또는 서버 adapter가 맡는다. |
| SSTP/외부 이벤트 수신 | 부분 지원 | 원본 프로토콜을 그대로 열어두기보다, 웹 앱의 postMessage, custom event, API endpoint 중 어느 경계를 쓸지 정해야 한다. | 현재 `eventBridge` 방향을 유지하고, 외부 입력은 런타임 이벤트 또는 액션 호출로 변환한다. |
| 파일 설치/드래그 앤 드롭 | 미지원 | 브라우저 파일 권한과 저장소 정책이 다르고, 보안 검증이 필요하다. | 개발자용 패키지 로딩, 사용자용 import/export 기능을 분리해서 설계한다. |
| 고급 충돌 판정/마우스 리전 | 부분 지원 | 현재 hitbox는 웹 데모와 편집 흐름을 우선한다. 원본 수준의 복잡한 collision 정의는 데이터 포맷 안정화 뒤가 낫다. | 캐릭터 데이터의 `hitAreas`를 공식화하고, 편집기는 devtool로 유지한다. |
| 자동 업데이트/네트워크 배포 | 미지원 | 웹 앱의 배포와 캐시 전략에 가까운 문제라 캐릭터 런타임 코어가 직접 맡기 어렵다. | 앱 레벨 배포, service worker, 플러그인 registry 같은 별도 경계에서 다룬다. |

이 목록의 핵심은 "언젠가 전부 넣자"가 아니다.

웹 서비스에 방해되지 않고, 개발자가 코어를 건드리지 않는 매핑 구조로 흡수할 수 있을 때만 GhostNest 기능으로 가져온다.

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
- 어떤 상황에서 무엇을 실행할지의 문제인가?
  - 그렇다면 rule/action 매핑으로 해결한다.
- 캐릭터별 이미지, 표정, 말투, 히트박스의 문제인가?
  - 그렇다면 캐릭터 모듈 데이터로 해결한다.

## 마무리 우선순위

프로젝트 마무리는 다음 순서로 간다.

1. Action Lifecycle 기준을 확정한다.
2. 깨진 인코딩, 문서, 예시 데이터를 정리한다.
3. 지원 액션 목록을 공식 액션 카탈로그로 정리한다.
4. 기본 rule과 기본 메뉴를 preset 형태로 분리한다.
5. 개발자가 수정할 예시 매핑 파일을 제공한다.
6. API, DB, AI 결과를 액션으로 변환하는 예제를 정리한다.
7. README보다 개발자 가이드를 우선 정리해서 첫 진입 경험을 안정화한다.

## 최종 기준

GhostNest의 완성도는 나니카가 얼마나 많은 기능을 직접 품고 있는지로 판단하지 않는다.

개발자가 원하는 기능을 코어 수정 없이 액션에 매핑하고, 그 결과가 대사, 표정, 메뉴, 애니메이션, UI로 자연스럽게 표현되는지로 판단한다.

즉 최종 목표는 다음 문장이다.

> GhostNest는 기능을 직접 소유하는 캐릭터 앱이 아니라, 기능을 액션으로 연결하면 나니카처럼 행동하게 만드는 웹 런타임이다.
