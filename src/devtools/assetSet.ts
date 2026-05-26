import { requireElement } from "./assetShared.js";

type CharacterListResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  characters?: string[];
};
type AssetFile = {
  fileName: string;
  kind: "base" | "part" | "scene" | "asset";
  path: string;
  scope?: "character" | "common";
};
type AssetFilesResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  files?: AssetFile[];
};
type CharacterAssetsResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  assets?: {
    expressions?: Record<string, string | string[]>;
    surfaces?: Record<string, {
      id?: string;
      image?: string;
      expression?: string;
      alt?: string;
      layers?: Record<string, unknown>;
    }>;
  };
};
type SurfaceSaveResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  saved?: {
    path: string;
    surfaceId: string;
  };
};
type ExistingSurface = {
  surfaceId: string;
  image?: string;
  expression?: string;
  alt?: string;
  layerCount: number;
};

const newSurfaceSelectValue = "__new_surface__";
const characterSelect = requireElement(document.querySelector<HTMLSelectElement>("#characterSelect"), "#characterSelect");
const surfaceSelect = requireElement(document.querySelector<HTMLSelectElement>("#surfaceSelect"), "#surfaceSelect");
const surfaceIdInput = requireElement(document.querySelector<HTMLInputElement>("#surfaceIdInput"), "#surfaceIdInput");
const surfaceExpressionSelect = requireElement(document.querySelector<HTMLSelectElement>("#surfaceExpressionSelect"), "#surfaceExpressionSelect");
const surfaceAltInput = requireElement(document.querySelector<HTMLInputElement>("#surfaceAltInput"), "#surfaceAltInput");
const baseAssetSelect = requireElement(document.querySelector<HTMLSelectElement>("#baseAssetSelect"), "#baseAssetSelect");
const surfaceImageInput = requireElement(document.querySelector<HTMLInputElement>("#surfaceImageInput"), "#surfaceImageInput");
const preview = requireElement(document.querySelector<HTMLElement>("#setPreview"), "#setPreview");
const output = requireElement(document.querySelector<HTMLElement>("#setOutput"), "#setOutput");
const status = requireElement(document.querySelector<HTMLElement>("#setStatus"), "#setStatus");
const saveButton = requireElement(document.querySelector<HTMLButtonElement>("#saveSurfaceConfigButton"), "#saveSurfaceConfigButton");

let existingSurfaces: ExistingSurface[] = [];
let existingExpressions: Record<string, string | string[]> = {};
let savedAssetFiles: AssetFile[] = [];

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
 * Keeps Set options in numeric id order when possible.
 */
function sortExistingSurfaces(surfaces: ExistingSurface[]) {
  return [...surfaces].sort((left, right) =>
    left.surfaceId.localeCompare(right.surfaceId, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/**
 * Builds the Set payload shown and saved by this page.
 */
function createSurfaceSnippet() {
  const surfaceId = surfaceIdInput.value.trim() || "0";
  const image = surfaceImageInput.value.trim();
  const expression = surfaceExpressionSelect.value.trim();
  const alt = surfaceAltInput.value.trim();

  return {
    surfaceId,
    surface: {
      id: surfaceId,
      ...(image ? { image } : {}),
      ...(expression ? { expression } : {}),
      ...(alt ? { alt } : {}),
    },
  };
}

/**
 * Returns saved base image candidates for an expression.
 */
function getExpressionAssetPaths(expression: string) {
  const savedAsset = existingExpressions[expression];

  return Array.isArray(savedAsset)
    ? savedAsset
    : savedAsset
      ? [savedAsset]
      : [];
}

/**
 * Checks whether the Set can be reached by the runtime expression flow.
 */
function validateSurfaceSnippet(surfaceSnippet: ReturnType<typeof createSurfaceSnippet>) {
  const expression = surfaceSnippet.surface.expression;
  const image = surfaceSnippet.surface.image;

  if (!expression) {
    return "Set에 연결할 Expression을 선택하세요.";
  }

  if (!image) {
    return "Set의 기준 base 이미지를 선택하거나 직접 경로를 입력하세요.";
  }

  if (!getExpressionAssetPaths(expression).includes(image)) {
    return `먼저 Expression '${expression}' 등록을 완료하고, 그 후보 안에 Set base 이미지를 포함하세요.`;
  }

  return null;
}

/**
 * Refreshes the image and JSON preview.
 */
function renderOutputs() {
  const surfaceSnippet = createSurfaceSnippet();

  preview.replaceChildren();

  if (surfaceSnippet.surface.image) {
    const image = document.createElement("img");

    image.src = surfaceSnippet.surface.image;
    image.alt = surfaceSnippet.surface.alt ?? surfaceSnippet.surface.id;
    preview.append(image);
  } else {
    const empty = document.createElement("p");

    empty.textContent = "Set base 이미지를 선택하세요.";
    preview.append(empty);
  }

  output.textContent = JSON.stringify({
    surfacePath: `assets.surfaces[${JSON.stringify(surfaceSnippet.surfaceId)}]`,
    surface: surfaceSnippet.surface,
  }, null, 2);
}

/**
 * Renders base asset options for Set base selection.
 */
function renderBaseAssetOptions() {
  const baseAssets = savedAssetFiles.filter((assetFile) => assetFile.kind === "base" && assetFile.scope !== "common");

  baseAssetSelect.replaceChildren(new Option(baseAssets.length > 0 ? "base 이미지 선택" : "assets/base 이미지가 없어요.", ""));
  baseAssets.forEach((assetFile) => {
    const label = assetFile.path.replace(/^\.\/src\/characters\/[^/]+\/assets\/base\//, "");

    baseAssetSelect.append(new Option(label, assetFile.path));
  });
}

/**
 * Renders expression options from the saved expression map.
 */
function renderExpressionOptions() {
  const fixedExpressions = new Set(["neutral", "happy", "thinking", "surprised"]);
  const currentValue = surfaceExpressionSelect.value;

  surfaceExpressionSelect.replaceChildren(new Option("없음", ""));
  ["neutral", "happy", "thinking", "surprised"].forEach((expression) => {
    surfaceExpressionSelect.append(new Option(expression, expression));
  });
  Object.keys(existingExpressions)
    .filter((expression) => !fixedExpressions.has(expression))
    .sort((left, right) => left.localeCompare(right))
    .forEach((expression) => {
      surfaceExpressionSelect.append(new Option(expression, expression));
    });

  if (currentValue && Array.from(surfaceExpressionSelect.options).some((option) => option.value === currentValue)) {
    surfaceExpressionSelect.value = currentValue;
  }
}

/**
 * Loads saved base image files.
 */
async function loadSavedAssetFiles() {
  const characterId = characterSelect.value || "rine";
  const response = await fetch(`/api/devtools/asset-files?characterId=${encodeURIComponent(characterId)}`);
  const result = await readApiJson<AssetFilesResponse>(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? result.error ?? "저장된 에셋 목록을 불러오지 못했어요.");
  }

  savedAssetFiles = result.files ?? [];
  renderBaseAssetOptions();
}

/**
 * Loads existing Set and Expression data for the selected character.
 */
async function loadCharacterAssets() {
  const characterId = characterSelect.value || "rine";
  const response = await fetch(`/api/devtools/character-assets?characterId=${encodeURIComponent(characterId)}`);
  const result = await readApiJson<CharacterAssetsResponse>(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? result.error ?? "캐릭터 Set 정보를 불러오지 못했어요.");
  }

  const surfaces = result.assets?.surfaces ?? {};

  existingExpressions = result.assets?.expressions ?? {};
  renderExpressionOptions();
  existingSurfaces = sortExistingSurfaces(Object.entries(surfaces).map(([surfaceId, surface]) => {
    const existingSurface: ExistingSurface = {
      surfaceId: surface.id ?? surfaceId,
      layerCount: Object.keys(surface.layers ?? {}).length,
    };

    if (surface.image) {
      existingSurface.image = surface.image;
    }

    if (surface.expression) {
      existingSurface.expression = surface.expression;
    }

    if (surface.alt) {
      existingSurface.alt = surface.alt;
    }

    return existingSurface;
  }));

  surfaceSelect.replaceChildren(
    new Option("Set 선택", ""),
    new Option("새 Set 만들기", newSurfaceSelectValue),
  );
  existingSurfaces.forEach((surface) => {
    const label = [
      surface.surfaceId,
      surface.expression ? `expression ${surface.expression}` : "",
      `${surface.layerCount} layer`,
    ].filter(Boolean).join(" / ");

    surfaceSelect.append(new Option(label, surface.surfaceId));
  });

  await loadSavedAssetFiles();
  applySurfaceSelection();
  status.textContent = `${characterId} 캐릭터 Set을 불러왔어요.`;
}

/**
 * Loads available character ids from the dev server.
 */
async function loadCharacters() {
  characterSelect.replaceChildren(new Option("캐릭터를 불러오는 중이에요.", ""));

  try {
    const response = await fetch("/api/devtools/characters");
    const result = await readApiJson<CharacterListResponse>(response);

    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? result.error ?? "캐릭터 목록을 불러오지 못했어요.");
    }

    const characters = result.characters ?? [];

    characterSelect.replaceChildren(...characters.map((characterId) => new Option(characterId, characterId)));
    characterSelect.value = characters.includes("rine") ? "rine" : characters[0] ?? "";

    if (characterSelect.value) {
      await loadCharacterAssets();
      return;
    }

    status.textContent = "불러올 캐릭터가 없어요.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "캐릭터 목록을 불러오지 못했어요.";
  }
}

/**
 * Applies the selected Set to the editable fields.
 */
function applySurfaceSelection() {
  if (surfaceSelect.value === newSurfaceSelectValue) {
    surfaceIdInput.value = surfaceIdInput.value.trim() || "0";
    surfaceExpressionSelect.value = "";
    surfaceAltInput.value = "";
    surfaceImageInput.value = "";
    baseAssetSelect.value = "";
    renderOutputs();
    return;
  }

  const surface = existingSurfaces.find((item) => item.surfaceId === surfaceSelect.value);

  surfaceIdInput.value = surface?.surfaceId ?? surfaceIdInput.value;
  surfaceExpressionSelect.value = surface?.expression ?? "";
  surfaceAltInput.value = surface?.alt ?? "";
  surfaceImageInput.value = surface?.image ?? "";
  baseAssetSelect.value = surface?.image ?? "";
  renderOutputs();
}

/**
 * Saves the current Set metadata to the selected character.
 */
async function saveSurfaceConfig() {
  const surfaceSnippet = createSurfaceSnippet();
  const validationMessage = validateSurfaceSnippet(surfaceSnippet);

  if (validationMessage) {
    status.textContent = validationMessage;
    return;
  }

  saveButton.disabled = true;
  status.textContent = "Set을 저장하는 중이에요.";

  try {
    const response = await fetch("/api/devtools/save-character-surface", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: characterSelect.value || "rine",
        surface: surfaceSnippet,
      }),
    });
    const result = await readApiJson<SurfaceSaveResponse>(response);

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `Set 저장 실패: ${result.error ?? response.status}`;
      return;
    }

    await loadCharacterAssets();
    surfaceSelect.value = surfaceSnippet.surfaceId;
    status.textContent = `${result.saved?.path ?? "character index.ts"}에 Set을 저장했어요.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Set 저장 요청에 실패했어요.";
  } finally {
    saveButton.disabled = false;
    renderOutputs();
  }
}

/**
 * Wires the Set settings page.
 */
function init() {
  characterSelect.addEventListener("change", () => {
    void loadCharacterAssets();
  });
  surfaceSelect.addEventListener("change", applySurfaceSelection);
  baseAssetSelect.addEventListener("change", () => {
    surfaceImageInput.value = baseAssetSelect.value;
    renderOutputs();
  });
  [surfaceIdInput, surfaceExpressionSelect, surfaceAltInput, surfaceImageInput].forEach((input) => {
    input.addEventListener("input", renderOutputs);
    input.addEventListener("change", renderOutputs);
  });
  saveButton.addEventListener("click", () => {
    void saveSurfaceConfig();
  });

  void loadCharacters();
}

init();
