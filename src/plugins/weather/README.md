# 날씨 플러그인

공개 날씨 API를 호출하는 샘플 `RuntimePlugin`이다.

## 보여주는 패턴

- 비동기 API 호출
- 실패 시 fallback 메시지 반환
- API 결과를 캐릭터 대사와 표정으로 변환

## 바꿔 쓰는 방향

실제 서비스에서는 좌표, 인증, 서버 API 호출, 캐시 정책을 개발자 앱 쪽에서 결정한다. GhostNest에는 `PluginResult`만 반환한다.
