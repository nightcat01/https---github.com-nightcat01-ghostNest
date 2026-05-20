import type { DialogueChoice, DialogueScript } from "../core/types.js";
type DialoguePlayerOptions = {
    typingInterval: number;
    onText: (text: string) => void;
    onClear: () => void;
    onSurface: (id: string) => void;
    onChoice: (choices: DialogueChoice[]) => void;
    onMouth?: (isOpen: boolean) => void;
    onEnd: () => void;
    onStop?: () => void;
};
export declare function createDialoguePlayer({ typingInterval, onText, onClear, onSurface, onChoice, onMouth, onEnd, onStop, }: DialoguePlayerOptions): {
    play: (script: DialogueScript) => Promise<void>;
    skip: () => void;
    stop: () => void;
    getIsPlaying: () => boolean;
};
export {};
//# sourceMappingURL=dialoguePlayer.d.ts.map