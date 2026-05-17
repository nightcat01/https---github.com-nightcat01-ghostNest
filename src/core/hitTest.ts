import type { CharacterTouchPart } from "./types.js";

/**
 * sprite 내부 클릭 좌표를 캐릭터 부위 ID로 변환합니다.
 */
export function getCharacterTouchPart(clientX: number, clientY: number, rect: DOMRect): CharacterTouchPart {
  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;

  if (relativeY < 0.36) {
    return "head";
  }

  if (relativeY < 0.58 && relativeX > 0.22 && relativeX < 0.78) {
    return "face";
  }

  return "body";
}
