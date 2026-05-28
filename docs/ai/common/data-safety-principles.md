# Data Safety Principles

이 문서는 저장, 삭제, 파일 생성, 자동 반영 작업의 공용 안전 기준이다.

## 고위험 작업

- 파일 삭제
- recursive move/delete
- 원본 설정 덮어쓰기
- generated 결과를 source에 자동 반영
- 사용자 데이터 migration
- 외부 경로 쓰기

## 원칙

- 쓰기 대상 경로를 먼저 확인한다.
- source와 generated/draft를 구분한다.
- 삭제보다 비활성화 또는 draft를 우선 검토한다.
- 자동 반영 전 사람이 검수할 수 있는 결과를 남긴다.
- 사용자 변경을 되돌리지 않는다.
- path traversal 가능성을 확인한다.

## 보고 기준

- 쓰기 대상 파일
- 삭제 또는 덮어쓰기 여부
- rollback 또는 draft 가능성
- 검증 방법
- 남은 위험
