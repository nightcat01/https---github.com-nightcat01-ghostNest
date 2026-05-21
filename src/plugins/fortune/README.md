# 운세 플러그인

로컬 더미 운세를 반환하는 샘플 `RuntimePlugin`이다.

## 보여주는 패턴

- 외부 기능 결과를 `PluginResult`로 반환
- `expression`으로 캐릭터 표정 변경
- `call_plugin` 액션으로 메뉴에서 호출

## 바꿔 쓰는 방향

실제 서비스에서는 `fortunes` 배열 대신 API, DB, AI 결과를 가져오고, 최종 반환값만 `PluginResult` 형태로 맞추면 된다.
