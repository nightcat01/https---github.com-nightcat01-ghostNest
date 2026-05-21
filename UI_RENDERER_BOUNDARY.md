# UI Renderer Boundary

이 문서는 GhostNest의 UI renderer 교체 경계를 정리한다.

현재 목표는 즉시 renderer 교체 API를 완성하는 것이 아니라, 어떤 UI 책임이 어디에 묶여 있는지 명확히 해서 나중에 말풍선, 메뉴, 패널, 캐릭터 표시 방식을 교체할 수 있게 만드는 것이다.

## 현재 렌더링 경계

| 영역 | 현재 파일 | 책임 |
| --- | --- | --- |
| 캐릭터 표시 | `src/runtime/characterRenderer.ts` | 표정 이미지, surface, layer, mouth animation, sprite 상태 |
| 메뉴 표시 | `src/runtime/managementMenu.ts` | management menu, depth navigation, panel/balloon display, hover preview hook |
| 대사 표시 | `src/runtime/createGhostRuntime.ts` | speaker, text, DialogueScript player 연결, 선택지 버튼 |
| 레이아웃 보정 | `src/runtime/floatingLayout.ts` | 말풍선/패널 높이와 위치 보정 |
| 외부 UI 열기 | `open_ui`, `close_ui` action | `[data-runtime-ui]` 기반 UI 표시/숨김 |

## 교체 가능한 것과 아닌 것

교체 가능한 UI 책임:

- 말풍선 DOM 구조와 스타일
- management menu 표시 방식
- panel형 메뉴 renderer
- DialogueScript 선택지 renderer
- 캐릭터 이미지 renderer
- layer animation 표시 방식

코어에 남아야 하는 책임:

- event -> rule -> action 실행
- `RuntimeAction` 해석
- `DialogueScript` 실행 순서
- plugin, dialogueEngine, storageAdapter 호출
- 캐릭터 데이터 타입과 런타임 상태

즉 renderer는 "어떻게 보일지"를 바꿀 수 있지만, "언제 어떤 액션이 실행되는지"를 소유하면 안 된다.

## 이상적인 future interface

나중에 renderer 교체 API를 열면 다음 정도의 경계를 목표로 한다.

```ts
type DialogueRenderer = {
  clear: () => void;
  renderText: (text: string) => void;
  renderSpeaker: (speaker: string) => void;
  renderChoices: (choices: DialogueChoice[], select: (index: number) => void) => void;
};

type ManagementMenuRenderer = {
  open: (options: ManagementMenuRenderRequest) => void;
  close: () => void;
};

type CharacterViewRenderer = {
  renderState: (state: RuntimeState) => void;
  applySurface: (surfaceId: string) => void;
  setLayerAnimationActive: (layerId: CharacterLayerId, active: boolean) => void;
  destroy: () => void;
};
```

이 interface는 아직 구현 계약이 아니라 설계 기준이다.

## 현재 유지할 방향

현재 2차 정리에서는 다음 원칙을 유지한다.

1. renderer 교체를 이유로 런타임 실행 구조를 크게 바꾸지 않는다.
2. UI 구현은 `src/runtime` 안의 렌더링 모듈에 모은다.
3. `src/ghost/actions.ts`는 renderer 구현을 직접 알지 않는다.
4. 사용자가 고르는 UI 설정은 action과 `StorageAdapter`를 통해 저장한다.
5. 데모 UI는 예시일 뿐이며, 서비스별 UI는 selector와 renderer 경계를 통해 교체할 수 있어야 한다.
6. PC/모바일 같은 환경 정책은 코어가 직접 판단하지 않고, 개발자가 필요한 이벤트와 rule을 매핑한다.

## 환경별 UI 진입 경로

환경별 차이가 필요할 때도 액션을 둘로 나누지 않는다.

예를 들어 관리 메뉴는 `open_management_menu` 액션 하나를 유지하고, 데스크톱 우클릭, 모바일 버튼, 키보드 shortcut 같은 여러 진입 경로가 같은 actions 배열을 실행하게 만든다.

```txt
desktop right click -> character:right_click -> open_management_menu
mobile button -> command:management_menu -> open_management_menu
```

이 구조에서는 서비스가 모바일 버튼을 제공할지, long press를 쓸지, 별도 메뉴 버튼을 없앨지 직접 결정한다.

## 다음에 분리할 후보

현재 코드에서 나중에 분리할 가치가 큰 부분은 다음이다.

| 후보 | 이유 |
| --- | --- |
| `renderDialogueChoices()` | 지금은 `createGhostRuntime.ts` 내부에 있어 대사 renderer 교체 시 먼저 걸린다 |
| `renderSpeech()` / `renderPreviewSpeech()` | DialoguePlayer와 DOM 반영이 한 함수에 묶여 있다 |
| `ManagementMenuTargets` | balloon/panel 외 renderer가 생기면 target 구조가 넓어질 수 있다 |
| `getRuntimeUi()` | `[data-runtime-ui]` 방식 외 modal/router integration이 필요할 수 있다 |

이 후보들은 바로 분리하지 않고, 실제 교체 요구가 생길 때 interface를 확정한다.
