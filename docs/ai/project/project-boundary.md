# GhostNest Project Boundary

이 문서는 GhostNest 전용 책임 경계 기준이다.

## core/runtime

런타임 실행에 반드시 필요한 것만 둔다.

- `RuntimeAction`, `RuntimeRule`, `RuntimePlugin`
- 이벤트, 액션 실행 흐름
- `controls`, `userPreferences`
- 공통 타입과 최소 어댑터
- 캐릭터 렌더링과 대사 재생

## plugin/devtools

개발자 편의, 편집 화면, 조립 도구를 둔다.

- character settings
- nanika mapping
- action/event/capability catalog
- mapping/preset/registry 조립
- devtool 화면과 API

## character data

캐릭터별 표현과 리소스를 둔다.

- profile
- lines
- expressions
- surfaces
- scenes
- layers
- hit areas

## demo preset

샘플과 기본 조립 예시를 둔다.

- demo menu preset
- sample plugins
- default rules
- 예시 UI 설정

## docs/config

설명, 방향성, 실행 설정을 둔다.

- 개발자 가이드
- AI harness
- extension config
- package/build 설정

## 판단 기준

편집 UI와 설명 데이터는 core/runtime에 넣지 않는다.

런타임이 실행하는 최종 규격은 core/runtime에 두고, 사람이 그 규격을 만들기 쉽게 돕는 도구는 plugin/devtools에 둔다.
