import type { DialogueScript, DialogueToken } from "./types.js";

const waitUnitMs = 50;

function pushText(tokens: DialogueToken[], text: string) {
  if (!text) {
    return;
  }

  const lastToken = tokens[tokens.length - 1];

  if (lastToken?.type === "text") {
    lastToken.value += text;
    return;
  }

  tokens.push({ type: "text", value: text });
}

function readBracketValue(script: string, startIndex: number) {
  if (script[startIndex] !== "[") {
    return null;
  }

  const endIndex = script.indexOf("]", startIndex + 1);

  if (endIndex === -1) {
    return null;
  }

  return {
    value: script.slice(startIndex + 1, endIndex),
    nextIndex: endIndex + 1,
  };
}

function readDigits(script: string, startIndex: number) {
  let currentIndex = startIndex;

  while (currentIndex < script.length && /[0-9]/.test(script[currentIndex] ?? "")) {
    currentIndex += 1;
  }

  if (currentIndex === startIndex) {
    return null;
  }

  return {
    value: script.slice(startIndex, currentIndex),
    nextIndex: currentIndex,
  };
}

/**
 * SakuraScript의 작은 부분집합을 내부 DialogueToken 배열로 변환합니다.
 */
export function parseSakuraScript(script: string): DialogueScript {
  const tokens: DialogueToken[] = [];
  let textBuffer = "";
  let index = 0;

  const flushText = () => {
    pushText(tokens, textBuffer);
    textBuffer = "";
  };

  while (index < script.length) {
    const character = script[index];

    if (character !== "\\") {
      textBuffer += character;
      index += 1;
      continue;
    }

    const command = script[index + 1];

    if (!command) {
      textBuffer += character;
      index += 1;
      continue;
    }

    switch (command) {
      case "w":
        {
          const bracketValue = readBracketValue(script, index + 2);
          const digitValue = bracketValue ?? readDigits(script, index + 2);
          const waitValue = Number(digitValue?.value);

          if (!digitValue || !Number.isFinite(waitValue)) {
            textBuffer += "\\w";
            index += 2;
            break;
          }

          flushText();
          tokens.push({
            type: "wait",
            ms: bracketValue ? Math.max(0, waitValue) : Math.max(0, waitValue * waitUnitMs),
          });
          index = digitValue.nextIndex;
        }
        break;
      case "s":
        {
          const bracketValue = readBracketValue(script, index + 2);

          if (!bracketValue) {
            textBuffer += "\\s";
            index += 2;
            break;
          }

          flushText();
          tokens.push({ type: "surface", id: bracketValue.value });
          index = bracketValue.nextIndex;
        }
        break;
      case "c":
        flushText();
        tokens.push({ type: "clear" });
        index += 2;
        break;
      case "n":
        flushText();
        tokens.push({ type: "newline" });
        index += 2;
        break;
      case "e":
        flushText();
        tokens.push({ type: "end" });
        index += 2;
        break;
      default:
        textBuffer += `\\${command}`;
        index += 2;
        break;
    }
  }

  flushText();

  return tokens;
}
