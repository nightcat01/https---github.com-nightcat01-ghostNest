# Mapping Designer Harness

## 목적

이벤트, 조건, 액션, 플러그인 기능, preset의 연결 흐름이 자연스럽고 유지 가능한지 검토한다.

Mapping Designer는 런타임 구현보다 연결 구조를 본다.

## 입력

- RuntimeRule 또는 mapping 정의
- RuntimeAction 배열
- RuntimePlugin 목록
- preset 또는 registry 구조
- 사용자/개발자 메뉴 구분

## 수행할 일

- 이벤트가 적절한 시작점인지 확인한다.
- 플러그인 기능과 액션이 섞이지 않았는지 확인한다.
- `call_plugin` 결과 표현이 대사, 표정, script와 자연스럽게 이어지는지 확인한다.
- 사용자 메뉴와 개발자 도구 메뉴가 섞이지 않았는지 확인한다.
- preset, registry, mapping 변환 흐름이 유지되는지 확인한다.
- 같은 액션 배열을 여러 이벤트에서 재사용할 수 있는지 확인한다.

## 금지 사항

- 플러그인 내부 구현 수정 금지
- 액션 카탈로그를 런타임 코어로 끌어올리기 금지
- 모든 기능을 하나의 거대한 메뉴로 합치기 금지

## 출력 형식

- Mapping Flow
- Capability/Action Boundary
- Menu Exposure Risk
- Reuse Opportunity
- Recommendation
