# GhostNest Asset Safety

이 문서는 GhostNest 캐릭터 에셋 저장 안전 기준이다.

## 폴더 구분

- `base`: 캐릭터 기본 이미지
- `parts`: 눈, 입, 장식, 소품 같은 파츠 이미지
- `common`: 여러 캐릭터가 공유 가능한 에셋
- `generated`: 생성 결과 또는 draft 성격의 데이터

## 저장 원칙

- 생성 결과는 가능한 검수 가능한 draft로 둔다.
- 기존 `index.ts`를 덮어쓰기보다 split 파일을 병합하는 흐름을 우선한다.
- 캐릭터별 데이터와 공통 에셋을 섞지 않는다.
- 저장 API는 character id와 workspace path를 검증한다.
- 저장 후 선택 목록, 미리보기, 생성된 split 파일이 같은 데이터를 가리키는지 확인한다.
- 캐릭터를 전환하면 이전 캐릭터의 base, parts, scene 미리보기가 남지 않아야 한다.

## 삭제 원칙

- 삭제는 고위험 작업이다.
- 대상 경로가 workspace 안인지 먼저 확인한다.
- 사용자 변경을 되돌리지 않는다.
- 삭제보다 비활성화 또는 draft 정리를 우선 검토한다.
- 삭제 후 select 값, preview, status message를 안전한 기본 상태로 되돌린다.

## scene/layer 주의점

- scene은 이미지 그룹이므로 이미지 파일과 동일하게 취급하지 않는다.
- layer animation은 base/surface 매칭을 벗어나지 않아야 한다.
- mouth animation은 말할 때만 움직이는 기본 원칙을 유지한다.
