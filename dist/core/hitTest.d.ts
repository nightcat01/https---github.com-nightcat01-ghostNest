import type { CharacterTouchPart, CharacterTouchArea } from "./types.js";
/**
 * sprite 내부 클릭 좌표를 캐릭터 부위 ID로 변환합니다.
 * customHitAreas가 제공되면 이를 우선적으로 검사합니다.
 */
export declare function getCharacterTouchPart(clientX: number, clientY: number, rect: DOMRect, customHitAreas?: Partial<Record<CharacterTouchPart, CharacterTouchArea>>): CharacterTouchPart;
//# sourceMappingURL=hitTest.d.ts.map