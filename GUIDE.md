# GhostNest Integrated Guide

처음 보는 개발자는 이 문서부터 보면 된다.

GhostNest는 기능을 직접 품은 완성 앱이 아니라, 개발자가 만든 API, DB, AI, UI 결과를 캐릭터 행동으로 연결해주는 웹 런타임이다.

## 먼저 이해할 것

개발자가 주로 보는 파일은 3개다.

| 파일 | 역할 |
| --- | --- |
| `src/ghost/character.ts` | 사용할 캐릭터 선택 |
| `src/ghost/nanika.config.ts` | 플러그인, selector, 저장소, 런타임 옵션 연결 |
| `src/ghost/actions.ts` | 메뉴와 이벤트를 액션에 매핑 |

일반적인 기능 추가에서는 `src/core`, `src/runtime`, `dist`를 직접 수정하지 않는 것을 목표로 한다.

## 기본 작업 흐름

```txt
1. 외부 기능을 만든다
2. plugin, dialogueEngine, storageAdapter 중 알맞은 경계로 감싼다
3. src/ghost/nanika.config.ts에 등록한다
4. src/ghost/actions.ts에서 메뉴나 이벤트에 매핑한다
5. 캐릭터가 대사, 표정, 메뉴, UI, 애니메이션으로 표현한다
```

## 가장 흔한 작업

### 캐릭터 바꾸기

`src/ghost/character.ts`에서 export를 교체한다.

```ts
import { rine } from "../characters/rine/index.js";

export const character = rine;
```

캐릭터 구조는 [src/characters/README.md](./src/characters/README.md)를 본다.

### 플러그인 추가하기

`src/ghost/nanika.config.ts`의 `externalFeatures`에 추가한다.

```ts
const externalFeatures = [
  ...createDemoPlugins(),
  myPlugin,
];
```

플러그인 예시는 [src/plugins/README.md](./src/plugins/README.md)를 본다.

### 메뉴에 기능 붙이기

`src/ghost/actions.ts` 또는 데모 menu preset에서 `actions` 배열을 추가한다.

```ts
{
  id: "my-feature",
  label: "내 기능",
  actions: [
    { type: "call_plugin", pluginId: "my_plugin" },
    { type: "log", label: "management.my_feature" },
  ],
}
```

지원 액션은 [ACTION_CATALOG.md](./ACTION_CATALOG.md)를 본다.

### 저장소 바꾸기

`StorageAdapter`를 만들어 `nanika.config.ts`에 연결한다.

HTTP 저장소 예시는 [src/examples/httpStorageAdapter.example.ts](./src/examples/httpStorageAdapter.example.ts)를 본다.

### 데모를 가져다 쓰기

데모는 그대로 쓰기보다 필요한 부분만 가져와서 `src/ghost`에서 조립하는 것을 권장한다.

- 데모 preset: [src/demo/README.md](./src/demo/README.md)
- 데모 menu preset: [src/demo/menuPresets/README.md](./src/demo/menuPresets/README.md)
- 샘플 플러그인: [src/plugins/README.md](./src/plugins/README.md)
- 샘플 캐릭터: [src/characters/README.md](./src/characters/README.md)

## 더 자세히 볼 때

긴 설명이 필요하면 [DETAIL_GUIDE.md](./DETAIL_GUIDE.md)를 본다.
