# 캐릭터 모듈

`src/characters`는 캐릭터 데이터와 표현 리소스를 두는 영역이다.

캐릭터 모듈은 누가 등장하는지, 어떤 말투로 말하는지, 어떤 이미지와 히트박스를 사용하는지를 설명한다. 런타임 동작은 여전히 `src/ghost/actions.ts`에서 매핑한다.

## 권장 구조

각 캐릭터 디렉터리는 보통 다음 파일을 가진다.

| 파일 또는 리소스 | 역할 |
| --- | --- |
| `index.ts` | 런타임이 사용하는 `CharacterDefinition` export |
| `profile.ts` | 캐릭터 id, 이름, 말투, 기본 표정 |
| `lines.ts` | `speak` 액션에서 사용하는 대사 카테고리 |
| 이미지 파일 | 표정, surface, layer 리소스 |

## 현재 예시

| 캐릭터 | 역할 |
| --- | --- |
| [rine](./rine/README.md) | profile, lines, expressions, surfaces, mouth layer animation, hitAreas를 가진 풍부한 샘플 |
| [mira](./mira/README.md) | profile과 lines만 가진 최소 샘플 |

## 데이터 경계

캐릭터별로 달라지는 데이터는 이 영역에 둔다.

- profile과 말투
- 대사 line set
- 표정 이미지
- surface 정의
- mouth, eyes, ears, accessory 같은 layer frame
- hit area 좌표

서비스 API 호출, DB 로직, 메뉴 매핑, 운영 secret은 캐릭터 모듈에 넣지 않는다.

## Surface와 Layer

`assets.expressions`는 단순 표정 이미지 매핑이다.

`assets.surfaces`는 DialogueScript와 layer 렌더링에서 사용하는 더 풍부한 surface 매핑이다. surface는 `layers`를 가질 수 있고, 각 layer는 animation frame을 제공할 수 있다.

예를 들어 리네는 `mouth` layer에 두 개의 frame을 둔다. 이후 캐릭터는 같은 구조로 눈 깜빡임, 귀 움직임, 꼬리, 날개, 의상 파츠를 확장할 수 있다.

## Hit Areas

`assets.hitAreas`는 정규화된 충돌 영역을 정의한다.

각 값은 `0`에서 `1` 사이를 사용한다.

- `minX`, `maxX`: 가로 범위
- `minY`, `maxY`: 세로 범위

이 값은 런타임 코드가 아니라 캐릭터 데이터다.

히트박스 에디터는 이 값을 눈으로 찾기 위한 개발 도구다. 에디터 저장값은 캐릭터 제작 중 임시 override로 본다.

배포할 hit area가 확정되면 에디터 JSON을 캐릭터 모듈에 복사해서 모든 사용자에게 같은 기본값을 전달한다.

```ts
assets: {
  hitAreas: {
    head: { minX: 0.2, maxX: 0.8, minY: 0, maxY: 0.35 },
  },
}
```

사용자별 설정은 `StorageAdapter`에 남기고, 캐릭터 기본값은 캐릭터 파일에 둔다.

개발자 도구 값도 DB-backed adapter를 포함한 `StorageAdapter`를 통해 저장될 수 있다. 다만 캐릭터 모듈에 복사되기 전까지는 제작/검수용 데이터로 취급한다.
