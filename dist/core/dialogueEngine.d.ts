import type { CharacterProfile, DialogueLineSet, DialogueEngine } from "./types.js";
type DialogueEngineOptions = {
    profile: CharacterProfile;
    lines: DialogueLineSet;
};
/**
 * 캐릭터 프로필과 대사 목록을 받아 말풍선 메시지를 생성하는 엔진을 만듭니다.
 */
export declare function createDialogueEngine({ profile, lines }: DialogueEngineOptions): DialogueEngine;
export {};
//# sourceMappingURL=dialogueEngine.d.ts.map