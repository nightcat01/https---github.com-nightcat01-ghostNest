import { requireElement } from "./assetShared.js";
import {
  AssetFile,
  createDevtoolsApiPath,
  fetchAssetFiles,
  fetchCharacterAssets,
  readApiJson,
} from "./assetApi.js";
import { populateCharacterSelect } from "./assetCharacterSelect.js";
import {
  CharacterAssetSaveKind,
  createCharacterAssetSaveDirectory,
  createSavedAssetPaths,
  readImageFiles,
  saveUploadedAssetFiles,
} from "./assetUpload.js";
import { createAssetOptionLabel, filterAssetFiles } from "./assetSelect.js";
import type { CharacterExpressionAsset, CharacterVisualSource, RuntimeScene } from "../core/types.js";

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
const expressionSceneSelect = requireElement(document.querySelector<HTMLSelectElement>("#expressionSceneSelect"), "#expressionSceneSelect");
const uploadAssetKindSelect = requireElement(document.querySelector<HTMLSelectElement>("#uploadAssetKindSelect"), "#uploadAssetKindSelect");
const expressionImageInput = requireElement(document.querySelector<HTMLInputElement>("#expressionImageInput"), "#expressionImageInput");
const uploadExpressionImagesButton = requireElement(document.querySelector<HTMLButtonElement>("#uploadExpressionImagesButton"), "#uploadExpressionImagesButton");
const previewGrid = requireElement(document.querySelector<HTMLElement>("#expressionPreviewGrid"), "#expressionPreviewGrid");
const output = requireElement(document.querySelector<HTMLElement>("#expressionOutput"), "#expressionOutput");
const status = requireElement(document.querySelector<HTMLElement>("#expressionStatus"), "#expressionStatus");
const saveExpressionButton = requireElement(document.querySelector<HTMLButtonElement>("#saveExpressionButton"), "#saveExpressionButton");
const deleteExpressionButton = requireElement(document.querySelector<HTMLButtonElement>("#deleteExpressionButton"), "#deleteExpressionButton");

let existingExpressions: Record<string, CharacterExpressionAsset> = {};
let existingScenes: Record<string, RuntimeScene> = {};
let savedAssetFiles: AssetFile[] = [];
const newExpressionSelectValue = "__new_expression__";

type ExpressionCandidate = string | CharacterVisualSource;
type SceneVisualSource = Extract<CharacterVisualSource, { type: "scene" }>;

/**
 * Returns the selected asset folder for image uploads.
 */
function getUploadAssetKind() {
  const selectedKind = uploadAssetKindSelect.value;

  return selectedKind === "base" || selectedKind === "parts" || selectedKind === "scenes"
    ? selectedKind
    : "base";
}

/**
 * Builds the expression payload shown and saved by this page.
 */
function createExpressionSnippet() {
  const expression = getSelectedExpression();
  const assets = Array.from(expressionAssetSelect.selectedOptions)
    .map((option) => option.value)
    .filter(Boolean);
  const sceneAssets = Array.from(expressionSceneSelect.selectedOptions)
    .map((option) => option.value)
    .filter(Boolean)
    .map((sceneId) => ({ type: "scene", sceneId } satisfies CharacterVisualSource));
  const candidates: ExpressionCandidate[] = [...assets, ...sceneAssets];

  return {
    expression,
    assets: candidates,
    value: candidates.length === 1 ? candidates[0] : candidates,
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
  deleteExpressionButton.disabled = isNewExpression || !getSelectedExpression();
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
    empty.textContent = "Expression에 연결할 base 이미지나 Scene 조합을 선택하면 여기에 미리보기가 표시됩니다.";
    previewGrid.append(empty);
    return;
  }

  expressionSnippet.assets.forEach((asset, index) => {
    const card = document.createElement("article");
    const title = document.createElement("strong");
    const pathText = document.createElement("small");

    card.className = "asset-preview-card asset-expression-preview-card";
    title.textContent = `${expressionSnippet.expression} 후보 ${index + 1}`;
    if (typeof asset === "string") {
      const image = document.createElement("img");

      image.src = asset;
      image.alt = `${expressionSnippet.expression} 후보 ${index + 1}`;
      pathText.textContent = asset.split("/").pop() ?? asset;
      card.append(title, image, pathText);
    } else if (asset.type === "scene") {
      const scenePreview = createScenePreview(asset.sceneId);

      pathText.textContent = `Scene: ${asset.sceneId}`;
      card.append(title, scenePreview, pathText);
    } else {
      const image = document.createElement("img");

      image.src = asset.src;
      image.alt = `${expressionSnippet.expression} 후보 ${index + 1}`;
      pathText.textContent = asset.src.split("/").pop() ?? asset.src;
      card.append(title, image, pathText);
    }
    previewGrid.append(card);
  });
}

/**
 * Creates a compact visual preview for a saved Scene composition.
 */
function createScenePreview(sceneId: string) {
  const scene = existingScenes[sceneId];
  const stage = document.createElement("div");

  stage.className = "asset-scene-preview asset-set-scene-preview";
  stage.dataset.sceneId = sceneId;

  if (!scene) {
    const empty = document.createElement("p");

    empty.textContent = `${sceneId} Scene을 찾지 못했어요.`;
    stage.append(empty);
    return stage;
  }

  scene.layers
    .filter((layer) => layer.image || layer.color || layer.role === "background")
    .sort((current, next) => (current.depth ?? 0) - (next.depth ?? 0))
    .forEach((layer) => {
      const layerElement = document.createElement("div");

      layerElement.className = "asset-scene-preview-layer";
      layerElement.style.zIndex = String(layer.depth ?? 0);
      if (layer.placement) {
        layerElement.style.left = `${layer.placement.x}%`;
        layerElement.style.top = `${layer.placement.y}%`;
        layerElement.style.width = `${layer.placement.width}%`;
        layerElement.style.height = `${layer.placement.height}%`;
      } else {
        layerElement.style.inset = "0";
      }

      if (layer.color) {
        layerElement.style.background = layer.color;
      }

      if (layer.image) {
        const image = document.createElement("img");

        image.src = layer.image;
        image.alt = layer.alt ?? layer.id;
        layerElement.append(image);
      }

      stage.append(layerElement);
    });

  return stage;
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
  const assetCandidates = Array.isArray(expressionAsset)
    ? expressionAsset
    : expressionAsset
      ? [expressionAsset]
      : [];
  const assetPaths = assetCandidates.filter((asset): asset is string => typeof asset === "string");
  const sceneIds = assetCandidates
    .filter((asset): asset is SceneVisualSource => typeof asset !== "string" && asset.type === "scene")
    .map((asset) => asset.sceneId);

  Array.from(expressionAssetSelect.options).forEach((option) => {
    option.selected = assetPaths.includes(option.value);
  });
  Array.from(expressionSceneSelect.options).forEach((option) => {
    option.selected = sceneIds.includes(option.value);
  });
  renderOutputs();
}

/**
 * Renders base image options from saved character assets.
 */
function renderBaseAssetOptions() {
  const baseAssets = filterAssetFiles(savedAssetFiles, ["base"], { includeCommon: false });

  expressionAssetSelect.replaceChildren(new Option(baseAssets.length > 0 ? "base 이미지 선택" : "assets/base 이미지가 없어요.", ""));
  baseAssets.forEach((assetFile) => {
    expressionAssetSelect.append(new Option(createAssetOptionLabel(assetFile), assetFile.path));
  });
  applyExpressionSelection();
}

/**
 * Renders saved Scene composition options separately from image files.
 */
function renderSceneOptions() {
  const currentValue = Array.from(expressionSceneSelect.selectedOptions).map((option) => option.value);
  const scenes = Object.values(existingScenes).sort((left, right) =>
    left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: "base" }),
  );

  expressionSceneSelect.replaceChildren(new Option(scenes.length > 0 ? "Scene 조합 선택 없음" : "저장된 Scene 조합이 없어요.", ""));
  scenes.forEach((scene) => {
    expressionSceneSelect.append(new Option(`${scene.id} / ${scene.layers.length} layer`, scene.id));
  });
  Array.from(expressionSceneSelect.options).forEach((option) => {
    option.selected = currentValue.includes(option.value);
  });
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
 * Loads base and scene image files that can be attached to expressions.
 */
async function loadSavedAssetFiles() {
  const characterId = characterSelect.value || "rine";
  savedAssetFiles = await fetchAssetFiles(characterId);
  renderBaseAssetOptions();
}

/**
 * Loads existing expression settings for the selected character.
 */
async function loadCharacterAssets() {
  const characterId = characterSelect.value || "rine";
  const result = await fetchCharacterAssets(characterId);

  existingExpressions = result.assets?.expressions ?? {};
  existingScenes = result.assets?.scenes ?? {};
  renderExpressionOptions();
  renderSceneOptions();
  await loadSavedAssetFiles();
  status.textContent = `${characterId} 캐릭터 Expression을 불러왔어요.`;
}

/**
 * Loads available character ids from the dev server.
 */
async function loadCharacters() {
  try {
    const selectedCharacterId = await populateCharacterSelect(characterSelect);

    if (selectedCharacterId) {
      await loadCharacterAssets();
      return;
    }

    status.textContent = "불러올 캐릭터가 없어요.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "캐릭터 목록을 불러오지 못했어요.";
  }
}

/**
 * Saves selected browser files into the chosen character asset folder.
 */
async function uploadExpressionImages() {
  const files = Array.from(expressionImageInput.files ?? []);
  const assetKind = getUploadAssetKind();
  const characterId = characterSelect.value || "rine";

  if (files.length === 0) {
    status.textContent = "저장할 이미지를 먼저 선택하세요.";
    return;
  }

  uploadExpressionImagesButton.disabled = true;
  status.textContent = `${assetKind} 폴더에 이미지 ${files.length}개를 저장하는 중이에요.`;

  try {
    const images = await readImageFiles(files);
    const savedFiles = await saveUploadedAssetFiles(
      createCharacterAssetSaveDirectory(characterId, assetKind as CharacterAssetSaveKind),
      images,
    );
    const savedPaths = createSavedAssetPaths(savedFiles);

    await loadSavedAssetFiles();

    if (assetKind === "base") {
      Array.from(expressionAssetSelect.options).forEach((option) => {
        option.selected = savedPaths.includes(option.value) || option.selected;
      });
      renderOutputs();
    }

    expressionImageInput.value = "";
    status.textContent = `${assetKind} 폴더에 이미지 ${savedFiles.length}개를 저장했어요.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "이미지 저장 요청에 실패했어요.";
  } finally {
    uploadExpressionImagesButton.disabled = false;
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
    const response = await fetch(createDevtoolsApiPath("/api/devtools/save-character-expression"), {
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
 * Deletes the selected expression mapping from the character config.
 */
async function deleteExpressionConfig() {
  const expression = getSelectedExpression();

  if (!expression || expressionSelect.value === newExpressionSelectValue) {
    status.textContent = "삭제할 기존 Expression을 선택하세요.";
    return;
  }

  const confirmed = window.confirm(`${characterSelect.value || "rine"} 캐릭터의 '${expression}' Expression을 삭제할까요?`);

  if (!confirmed) {
    return;
  }

  deleteExpressionButton.disabled = true;
  status.textContent = "Expression을 삭제하는 중이에요.";

  try {
    const response = await fetch(createDevtoolsApiPath("/api/devtools/delete-character-expression"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: characterSelect.value || "rine",
        expression,
      }),
    });
    const result = await readApiJson<ExpressionSaveResponse>(response);

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `Expression 삭제 실패: ${result.error ?? response.status}`;
      return;
    }

    expressionSelect.value = "neutral";
    await loadCharacterAssets();
    status.textContent = `${expression} Expression을 삭제했어요.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Expression 삭제 요청에 실패했어요.";
  } finally {
    renderCustomExpressionField();
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
  expressionSceneSelect.addEventListener("change", renderOutputs);
  uploadExpressionImagesButton.addEventListener("click", () => {
    void uploadExpressionImages();
  });
  saveExpressionButton.addEventListener("click", () => {
    void saveExpressionConfig();
  });
  deleteExpressionButton.addEventListener("click", () => {
    void deleteExpressionConfig();
  });

  void loadCharacters();
}

init();
