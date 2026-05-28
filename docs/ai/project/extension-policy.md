# GhostNest Extension Policy

이 문서는 GhostNest 확장과 플러그인 배치 기준이다.

## core/runtime에 둘 것

- 실행 규격
- 공통 타입
- 이벤트/액션 실행
- 렌더링에 필요한 최소 기능
- controls와 userPreferences

## plugin/devtools에 둘 것

- 캐릭터 설정 화면
- asset generator
- mapping editor
- action/event/capability catalog
- preset/registry 조립 도구
- 개발자 전용 화면

## demo에 둘 것

- 샘플 메뉴
- 샘플 플러그인
- 예시 rule
- 예시 캐릭터 연결

## 사용자/개발자 구분

- 사용자는 허용된 UI 설정과 사용자 기능만 쓴다.
- 개발자는 캐릭터, 플러그인, 액션, 매핑, preset을 조립한다.
- 개발자 도구는 외부 사이트 사용자에게 노출되지 않는 경계에 둔다.

## 판단 기준

런타임 실행에 꼭 필요하지 않은 편집 편의 기능은 core/runtime에 넣지 않는다.

개발자가 연결하기 쉽게 만드는 도구는 plugin/devtools로 둔다.
