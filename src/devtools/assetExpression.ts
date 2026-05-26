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
  };
};
type ExpressionSaveResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  saved?: {
    path: string;
    expression: string;
  };
};

const characterSelect = requireElement(document.querySelector<HTMLSelectElement>("#characterSelect"), "#characterSelect");
const expressionSelect = requireElement(document.querySelector<HTMLSelectElement>("#expressionSelect"), "#expressionSelect");
const customExpressionField = requireElement(document.querySelector<HTMLElement>("#customExpressionField"), "#customExpressionField");
const customExpressionInput = requireElement(document.querySelector<HTMLInputElement>("#customExpressionInput"), "#customExpressionInput");
const expressionAssetSelect = requireElement(document.querySelector<HTMLSelectElement>("#expressionAssetSelect"), "#expressionAssetSelect");
const previewGrid = requireElement(document.querySelector<HTMLElement>("#expressionPreviewGrid"), "#expressionPreviewGrid");
const output = requireElement(document.querySelector<HTMLElement>("#expressionOutput"), "#expressionOutput");
const status = requireElement(document.querySelector<HTMLElement>("#expressionStatus"), "#expressionStatus");
const saveExpressionButton = requireElement(document.querySelector<HTMLButtonElement>("#saveExpressionButton"), "#saveExpressionButton");

let existingExpressions: Record<string, string | string[]> = {};
let savedAssetFiles: AssetFile[] = [];
const newExpressionSelectValue = "__new_expression__";

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
 * Builds the expression payload shown and saved by this page.
 */
function createExpressionSnippet() {
  const expression = getSelectedExpression();
  const assets = Array.from(expressionAssetSelect.selectedOptions)
    .map((option) => option.value)
    .filter(Boolean);

  return {
    expression,
    assets,
    value: assets.length === 1 ? assets[0] : assets,
  };
}

/**
 * Returns the selected expression id, including a newly typed one.
 */
function getSelectedExpression() {
  return expressionSelect.value === newExpressionSelectValue
    ? customExpressionInput.value.trim()
    : expressionSelect.value;
}

/**
 * Shows the custom expression field only for new expressions.
 */
function renderCustomExpressionField() {
  const isNewExpression = expressionSelect.value === newExpressionSelectValue;

  customExpressionField.hidden = !isNewExpression;
  customExpressionField.style.display = isNewExpression ? "grid" : "none";
}

/**
 * Renders selected expression image candidates as visible preview cards.
 */
function renderExpressionPreview() {
  const expressionSnippet = createExpressionSnippet();

  previewGrid.replaceChildren();

  if (expressionSnippet.assets.length === 0) {
    const empty = document.createElement("p");

    empty.className = "asset-preview-placeholder";
    empty.textContent = "Expression에 연결할 base 이미지를 선택하면 여기에 미리보기가 표시됩니다.";
    previewGrid.append(empty);
    return;
  }

  expressionSnippet.assets.forEach((assetPath, index) => {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    const image = document.createElement("img");
    const pathText = document.createElement("small");

    card.className = "asset-preview-card asset-expression-preview-card";
    title.textContent = `${expressionSnippet.expression} 후보 ${index + 1}`;
    image.src = assetPath;
    image.alt = `${expressionSnippet.expression} 후보 ${index + 1}`;
    pathText.textContent = assetPath.split("/").pop() ?? assetPath;
    card.append(title, image, pathText);
    previewGrid.append(card);
  });
}

/**
 * Refreshes the JSON preview for the selected expression.
 */
function renderOutputs() {
  const expressionSnippet = createExpressionSnippet();

  renderExpressionPreview();
  output.textContent = JSON.stringify({
    expressionPath: `assets.expressions.${expressionSnippet.expression}`,
    expression: expressionSnippet.value,
  }, null, 2);
}

/**
 * Applies the saved expression image list to the multi-select control.
 */
function applyExpressionSelection() {
  renderCustomExpressionField();

  const expression = getSelectedExpression();
  const expressionAsset = expression ? existingExpressions[expression] : undefined;
  const assetPaths = Array.isArray(expressionAsset)
    ? expressionAsset
    : expressionAsset
      ? [expressionAsset]
      : [];

  Array.from(expressionAssetSelect.options).forEach((option) => {
    option.selected = assetPaths.includes(option.value);
  });
  renderOutputs();
}

/**
 * Renders base image options from saved character assets.
 */
function renderBaseAssetOptions() {
  const baseAssets = savedAssetFiles.filter((assetFile) => assetFile.kind === "base" && assetFile.scope !== "common");

  expressionAssetSelect.replaceChildren(new Option(baseAssets.length > 0 ? "랜덤 이미지 선택" : "assets/base 이미지가 없어요.", ""));
  baseAssets.forEach((assetFile) => {
    const label = assetFile.path.replace(/^\.\/src\/characters\/[^/]+\/assets\/base\//, "");

    expressionAssetSelect.append(new Option(label, assetFile.path));
  });
  applyExpressionSelection();
}

/**
 * Adds saved custom expression names to the expression select.
 */
function renderExpressionOptions() {
  const fixedExpressions = new Set(["neutral", "happy", "thinking", "surprised"]);
  const currentValue = expressionSelect.value;

  Array.from(expressionSelect.options).forEach((option) => {
    if (!fixedExpressions.has(option.value) && option.value !== newExpressionSelectValue) {
      option.remove();
    }
  });

  Object.keys(existingExpressions)
    .filter((expression) => !fixedExpressions.has(expression))
    .sort((left, right) => left.localeCompare(right))
    .forEach((expression) => {
      expressionSelect.add(new Option(expression, expression), expressionSelect.options.length - 1);
    });

  if (currentValue && Array.from(expressionSelect.options).some((option) => option.value === currentValue)) {
    expressionSelect.value = currentValue;
  }
}

/**
 * Loads base image files that can be attached to expressions.
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
 * Loads existing expression settings for the selected character.
 */
async function loadCharacterAssets() {
  const characterId = characterSelect.value || "rine";
  const response = await fetch(`/api/devtools/character-assets?characterId=${encodeURIComponent(characterId)}`);
  const result = await readApiJson<CharacterAssetsResponse>(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? result.error ?? "캐릭터 Expression 정보를 불러오지 못했어요.");
  }

  existingExpressions = result.assets?.expressions ?? {};
  renderExpressionOptions();
  await loadSavedAssetFiles();
  status.textContent = `${characterId} 캐릭터 Expression을 불러왔어요.`;
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
 * Saves the selected image candidates to assets.expressions.
 */
async function saveExpressionConfig() {
  const expressionSnippet = createExpressionSnippet();

  if (expressionSnippet.assets.length === 0) {
    status.textContent = "Expression에 연결할 이미지를 하나 이상 선택하세요.";
    return;
  }

  if (!expressionSnippet.expression) {
    status.textContent = "Expression 이름을 입력하세요.";
    return;
  }

  saveExpressionButton.disabled = true;
  status.textContent = "Expression을 저장하는 중이에요.";

  try {
    const response = await fetch("/api/devtools/save-character-expression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: characterSelect.value || "rine",
        expression: expressionSnippet.expression,
        assets: expressionSnippet.assets,
      }),
    });
    const result = await readApiJson<ExpressionSaveResponse>(response);

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `Expression 저장 실패: ${result.error ?? response.status}`;
      return;
    }

    await loadCharacterAssets();
    expressionSelect.value = expressionSnippet.expression;
    customExpressionInput.value = "";
    applyExpressionSelection();
    status.textContent = `${result.saved?.path ?? "character index.ts"}에 Expression을 저장했어요.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Expression 저장 요청에 실패했어요.";
  } finally {
    saveExpressionButton.disabled = false;
    renderOutputs();
  }
}

/**
 * Wires the expression settings page.
 */
function init() {
  characterSelect.addEventListener("change", () => {
    void loadCharacterAssets();
  });
  expressionSelect.addEventListener("change", applyExpressionSelection);
  customExpressionInput.addEventListener("input", renderOutputs);
  customExpressionInput.addEventListener("change", renderOutputs);
  expressionAssetSelect.addEventListener("change", renderOutputs);
  saveExpressionButton.addEventListener("click", () => {
    void saveExpressionConfig();
  });

  void loadCharacters();
}

init();
