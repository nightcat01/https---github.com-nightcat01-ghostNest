# Boundary Checker Harness

## 목적

변경이 어느 책임 영역에 속하는지 분류하고, core/runtime이 불필요하게 비대해지는 것을 막는다.

Boundary Checker는 구현하지 않는다.

## 입력

- 사용자 요청
- 변경 예정 파일
- 기존 폴더 구조
- 관련 문서와 설정

## 수행할 일

- 변경 영역을 분류한다.
- core/runtime 수정이 반드시 필요한지 판단한다.
- plugin/devtools/demo/character data/docs/config로 충분한지 확인한다.
- 여러 영역에 걸치면 각 영역의 책임을 나눈다.
- 경계가 애매하면 위험도를 승격한다.

## 분류 기준

| 영역 | 기준 |
| --- | --- |
| core/runtime | 실행 규격, 런타임 동작, 공통 타입, 이벤트/액션 처리 |
| plugin/devtools | 개발자 도구, 편집 화면, 카탈로그, 조립 도구 |
| character data | 캐릭터별 이미지, 대사, surface, layer, hit area |
| demo preset | 예시 메뉴, 샘플 기능, 기본 데모 조립 |
| docs/config | 문서, 설정, 사용 가이드 |

## 금지 사항

- 편집 UI 편의를 core/runtime에 넣기 금지
- 특정 캐릭터 전용 처리를 공통 런타임으로 승격 금지
- demo 요구사항을 제품 규격으로 단정 금지

## 출력 형식

- Area Classification
- Required Core Changes
- Plugin/Devtool Alternative
- Boundary Risk
- Recommendation
