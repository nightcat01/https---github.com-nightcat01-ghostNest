# Storage And Settings

이 문서는 GhostNest가 저장하는 값과 `StorageAdapter` 경계를 정리한다.

GhostNest의 기본 저장소는 캐릭터 id별 localStorage adapter다.

```txt
ghostNest:{characterId}:{key}
```

예를 들어 `rine` 캐릭터의 `runtimeUi.options`는 기본 localStorage에서 다음 키로 저장된다.

```txt
ghostNest:rine:runtimeUi.options
```

## 저장 경계

| 저장값 | Adapter key | 쓰는 곳 | 초기화 |
| --- | --- | --- | --- |
| 메뉴 표시 방식 | `managementMenu.options` | `set_management_menu_display` | `reset_runtime_ui` |
| 말풍선 테마, 글자 크기, 캐릭터 위치 | `runtimeUi.options` | `change_balloon`, `change_balloon_font_size`, `move_character` | `reset_runtime_ui` |
| 개발자 히트박스 편집값 | `hitAreas` | hitbox editor devtool | devtool에서 재저장 또는 adapter remove |
| 개발자 임의 데이터 | action에서 지정한 key | `save_data`, `load_data` | 개발자가 직접 remove 처리 |

사용자 설정과 개발자 도구 설정은 성격이 다르다.

- 사용자 설정은 사용자별 선택값이며 `StorageAdapter`에 유지한다.
- 개발자 도구 설정은 제작 중 확인을 위한 임시 override다.
- 모든 사용자에게 배포할 기본값은 캐릭터 파일이나 설정 파일에 반영한다.

`StorageAdapter`는 저장 위치를 결정한다. localStorage, DB, HTTP API 중 어디로 저장되는지는 adapter 구현에 달려 있다.

데이터의 성격은 저장 위치가 아니라 key와 용도로 구분한다. 따라서 개발자 도구 값도 adapter를 타지만, 운영 default로 배포할 값은 최종적으로 캐릭터 데이터 파일에 반영한다.

## StorageAdapter

`StorageAdapter`는 저장 위치를 교체하기 위한 경계다.

```ts
export type StorageAdapter = {
  get: (key: string) => unknown | Promise<unknown>;
  set: (key: string, value: unknown) => void | Promise<void>;
  remove: (key: string) => void | Promise<void>;
};
```

기본 구현은 `createLocalStorageAdapter()`이며, `createGhostRuntime()`에 `storageAdapter`를 넘기지 않으면 자동으로 사용된다.

```ts
createLocalStorageAdapter(`ghostNest:${character.profile.id}`)
```

원격 저장소를 쓰고 싶다면 `src/ghost/nanika.config.ts`에서 adapter를 주입한다.

```ts
export const nanikaConfig = {
  plugins: externalFeatures,
  selectors: runtimeSelectors,
  storageAdapter: remoteStorageAdapter,
} satisfies Omit<GhostRuntimeOptions, "character" | "rules">;
```

HTTP API를 통해 DB나 서버 저장소에 연결하는 예시는 [src/examples/httpStorageAdapter.example.ts](./src/examples/httpStorageAdapter.example.ts)를 참고한다. 이 파일은 실제 DB 구현이 아니라 adapter 형태를 보여주는 샘플이다.

## Runtime UI Preferences

`runtimeUi.options`에는 사용자 UI 선택값이 모인다.

```ts
type RuntimeUiPreferences = {
  balloonTheme?: string;
  balloonFontSize?: string;
  characterPosition?: {
    x: number;
    y: number;
  };
};
```

현재 액션 매핑 기준:

- `change_balloon`은 `balloonTheme`을 저장한다.
- `change_balloon_font_size`는 `balloonFontSize`를 저장한다.
- `move_character`는 `characterPosition`을 저장한다.
- `reset_runtime_ui`는 `runtimeUi.options`와 `managementMenu.options`를 제거한다.

## Management Menu Options

`managementMenu.options`에는 메뉴 표시 방식이 저장된다.

```ts
type ManagementMenuOptions = {
  defaultDisplay?: ManagementMenuDisplay;
  displays?: Record<string, ManagementMenuDisplay>;
};
```

현재 액션 매핑 기준:

- `set_management_menu_display`에 `menuId`가 없으면 기본 표시 방식을 저장한다.
- `set_management_menu_display`에 `menuId`가 있으면 해당 메뉴의 표시 방식을 저장한다.

## Hit Areas

히트박스 에디터는 `hitAreas` key에 편집 결과를 저장한다.

```ts
{
  hitAreas: {
    head: { minX: 0.2, maxX: 0.8, minY: 0, maxY: 0.35 }
  }
}
```

히트박스는 개발자 도구 설정이지만, 저장소 경계는 다른 사용자 설정과 동일하게 `StorageAdapter`를 사용한다.

다만 히트박스 에디터의 저장값은 운영 default가 아니라 개발 중 임시 override로 본다. 새로고침이나 반복 조정 중 값이 날아가지 않도록 저장하는 편의 기능이다.

DB나 HTTP adapter를 사용하면 이 값도 원격 저장소에 저장될 수 있다. 그래도 성격은 "개발자 도구 작업값"이며, 모든 사용자에게 적용되는 default와는 구분한다.

모든 사용자에게 적용할 최종 hit area는 에디터에서 JSON을 복사한 뒤 캐릭터 모듈의 `assets.hitAreas`에 반영한다.

```txt
hitbox editor에서 눈으로 조정
-> JSON 복사
-> src/characters/{character}/index.ts의 assets.hitAreas에 반영
-> 빌드/배포
-> 모든 사용자에게 기본 hit area 적용
```

기본 localStorage 기준 실제 키는 다음과 같다.

```txt
ghostNest:{characterId}:hitAreas
```

## save_data 와 load_data

`save_data`와 `load_data`는 개발자가 지정한 key를 그대로 `StorageAdapter`에 전달한다.

```ts
{ type: "save_data", key: "last_fortune_result", value: "great_luck" }
{ type: "load_data", key: "last_fortune_result", speak: true }
```

기본 localStorage 기준 실제 키는 다음과 같다.

```txt
ghostNest:{characterId}:last_fortune_result
```

프로덕션 서비스에서 사용자별 저장이 필요하다면 adapter 안에서 현재 사용자 id, tenant id, 서버 endpoint 같은 정책을 적용한다.

## 체크리스트

새 저장값을 추가할 때는 다음을 확인한다.

1. 이 값은 사용자 설정인가, 개발자 도구 설정인가, 서비스 데이터인가?
2. 기존 key에 합치는 것이 맞는가, 새 key가 필요한가?
3. `StorageAdapter`를 통하는가?
4. 초기화 액션이 필요한가?
5. 캐릭터별로 분리되어야 하는가?
6. 원격 저장소를 쓸 때 인증/권한은 adapter 밖 서비스 코드에서 처리되는가?
