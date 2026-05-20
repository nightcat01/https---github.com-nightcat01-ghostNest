import type { DialogueChoice, DialogueScript, DialogueToken } from "../core/types.js";

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

type WaitHandle = {
  resolve: () => void;
  timerId: number;
};

function delay(ms: number) {
  let waitHandle: WaitHandle;

  const promise = new Promise<void>((resolve) => {
    const timerId = window.setTimeout(resolve, ms);
    waitHandle = { resolve, timerId };
  });

  return {
    promise,
    skip: () => {
      window.clearTimeout(waitHandle.timerId);
      waitHandle.resolve();
    },
  };
}

export function createDialoguePlayer({
  typingInterval,
  onText,
  onClear,
  onSurface,
  onChoice,
  onMouth,
  onEnd,
  onStop,
}: DialoguePlayerOptions) {
  let playToken = 0;
  let isPlaying = false;
  let currentWait: ReturnType<typeof delay> | null = null;
  let skipCurrentText: (() => void) | null = null;

  function stop() {
    const wasPlaying = isPlaying;
    playToken += 1;
    isPlaying = false;
    skipCurrentText = null;

    if (currentWait) {
      currentWait.skip();
      currentWait = null;
    }

    onMouth?.(false);

    if (wasPlaying) {
      onStop?.();
    }
  }

  function skip() {
    if (skipCurrentText) {
      skipCurrentText();
      return;
    }

    if (currentWait) {
      currentWait.skip();
    }
  }

  function getIsPlaying() {
    return isPlaying;
  }

  async function typeText(text: string, token: number) {
    const characters = Array.from(text);
    let skipped = false;

    if (characters.length > 0) {
      onMouth?.(true);
    }

    for (let index = 0; index < characters.length; index += 1) {
      if (token !== playToken) {
        skipCurrentText = null;
        return false;
      }

      const character = characters[index] ?? "";
      onText(character);
      skipCurrentText = () => {
        if (skipped) {
          return;
        }

        skipped = true;
        onText(characters.slice(index + 1).join(""));

        if (currentWait) {
          currentWait.skip();
        }
      };

      if (typingInterval > 0) {
        currentWait = delay(typingInterval);
        await currentWait.promise;
        currentWait = null;

        if (skipped) {
          skipCurrentText = null;
          return token === playToken;
        }
      }
    }

    skipCurrentText = null;
    onMouth?.(false);
    return true;
  }

  async function runToken(dialogueToken: DialogueToken, token: number) {
    switch (dialogueToken.type) {
      case "text":
        return typeText(dialogueToken.value, token);
      case "wait":
        onMouth?.(false);
        currentWait = delay(dialogueToken.ms);
        await currentWait.promise;
        currentWait = null;
        return token === playToken;
      case "surface":
        onSurface(dialogueToken.id);
        return true;
      case "clear":
        onMouth?.(false);
        onClear();
        return true;
      case "newline":
        onMouth?.(false);
        onText("\n");
        return true;
      case "choice":
        onMouth?.(false);
        onChoice(dialogueToken.choices);
        return false;
      case "end":
        onMouth?.(false);
        return false;
    }
  }

  async function play(script: DialogueScript) {
    stop();
    const token = playToken;
    isPlaying = true;

    for (const dialogueToken of script) {
      if (token !== playToken) {
        return;
      }

      const shouldContinue = await runToken(dialogueToken, token);

      if (!shouldContinue) {
        break;
      }
    }

    if (token === playToken) {
      isPlaying = false;
      onEnd();
    }
  }

  return {
    play,
    skip,
    stop,
    getIsPlaying,
  };
}
