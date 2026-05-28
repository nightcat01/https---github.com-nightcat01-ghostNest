import { requireElement } from "./assetShared.js";
import { createDevtoolsApiPath } from "./assetApi.js";

type CreateCharacterResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  created?: {
    characterId: string;
    path: string;
    buildPath?: string | null;
  };
};

const characterIdInput = requireElement(document.querySelector<HTMLInputElement>("#characterIdInput"), "#characterIdInput");
const characterNameInput = requireElement(document.querySelector<HTMLInputElement>("#characterNameInput"), "#characterNameInput");
const characterDescriptionInput = requireElement(document.querySelector<HTMLInputElement>("#characterDescriptionInput"), "#characterDescriptionInput");
const characterToneInput = requireElement(document.querySelector<HTMLInputElement>("#characterToneInput"), "#characterToneInput");
const createButton = requireElement(document.querySelector<HTMLButtonElement>("#createCharacterButton"), "#createCharacterButton");
const status = requireElement(document.querySelector<HTMLElement>("#characterCreateStatus"), "#characterCreateStatus");
const output = requireElement(document.querySelector<HTMLElement>("#characterCreateOutput"), "#characterCreateOutput");

/**
 * Reads a dev API response while preserving useful server error text.
 */
async function readApiJson<T extends { ok?: boolean; error?: string; message?: string }>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      ok: false,
      error: `http_${response.status}`,
      message: "API가 JSON이 아닌 응답을 보냈어요. 서버를 다시 시작했는지 확인하세요.",
    } as T;
  }
}

/**
 * Normalizes user input into a folder-safe character id preview.
 */
function sanitizeCharacterId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Builds the create-character payload.
 */
function createCharacterPayload() {
  const characterId = sanitizeCharacterId(characterIdInput.value);
  const name = characterNameInput.value.trim() || characterId;

  return {
    characterId,
    name,
    description: characterDescriptionInput.value.trim() || `${name} character`,
    tone: characterToneInput.value.trim() || "차분하고 친근한 말투",
  };
}

/**
 * Refreshes the JSON preview shown before creation.
 */
function renderOutput() {
  const payload = createCharacterPayload();

  output.textContent = JSON.stringify({
    create: payload,
    files: payload.characterId
      ? [
          `src/characters/${payload.characterId}/profile.ts`,
          `src/characters/${payload.characterId}/lines.ts`,
          `src/characters/${payload.characterId}/index.ts`,
          `src/characters/${payload.characterId}/assets/base`,
          `src/characters/${payload.characterId}/assets/parts`,
        ]
      : [],
  }, null, 2);
}

/**
 * Creates a new character scaffold through the dev server.
 */
async function createCharacter() {
  const payload = createCharacterPayload();

  if (!payload.characterId) {
    status.textContent = "캐릭터 ID를 입력하세요.";
    return;
  }

  createButton.disabled = true;
  status.textContent = "캐릭터를 만드는 중이에요.";

  try {
    const response = await fetch(createDevtoolsApiPath("/api/devtools/create-character"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await readApiJson<CreateCharacterResponse>(response);

    if (!response.ok || !result.ok || !result.created) {
      status.textContent = result.error === "character_already_exists"
        ? "이미 같은 ID의 캐릭터가 있어요."
        : result.message ?? `캐릭터 생성 실패: ${result.error ?? response.status}`;
      return;
    }

    status.textContent = `${result.created.characterId} 캐릭터를 만들었어요. 다음 단계에서 Expression을 등록하세요.`;
    output.textContent = JSON.stringify(result.created, null, 2);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "캐릭터 생성 요청에 실패했어요.";
  } finally {
    createButton.disabled = false;
  }
}

/**
 * Wires the character creation page.
 */
function init() {
  [
    characterIdInput,
    characterNameInput,
    characterDescriptionInput,
    characterToneInput,
  ].forEach((input) => {
    input.addEventListener("input", renderOutput);
    input.addEventListener("change", renderOutput);
  });
  createButton.addEventListener("click", () => {
    void createCharacter();
  });
  renderOutput();
}

init();
