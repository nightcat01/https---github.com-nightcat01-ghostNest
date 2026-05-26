import { requireElement } from "./assetShared.js";
import type { RuntimeScene, RuntimeSceneLayer } from "../core/types.js";

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
    defaultScene?: string;
    scenes?: Record<string, RuntimeScene>;
  };
};
type SceneSaveResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  saved?: {
    path: string;
    sceneId: string;
  };
};
type ScenePlacementInputs = {
  x: HTMLInputElement;
  y: HTMLInputElement;
  width: HTMLInputElement;
  height: HTMLInputElement;
};

const newSceneSelectValue = "__new_scene__";
const characterSelect = requireElement(document.querySelector<HTMLSelectElement>("#characterSelect"), "#characterSelect");
const sceneSelect = requireElement(document.querySelector<HTMLSelectElement>("#sceneSelect"), "#sceneSelect");
const sceneIdInput = requireElement(document.querySelector<HTMLInputElement>("#sceneIdInput"), "#sceneIdInput");
const defaultSceneInput = requireElement(document.querySelector<HTMLInputElement>("#defaultSceneInput"), "#defaultSceneInput");
const backgroundAssetSelect = requireElement(document.querySelector<HTMLSelectElement>("#backgroundAssetSelect"), "#backgroundAssetSelect");
const backgroundColorInput = requireElement(document.querySelector<HTMLInputElement>("#backgroundColorInput"), "#backgroundColorInput");
const backgroundDepthInput = requireElement(document.querySelector<HTMLInputElement>("#backgroundDepthInput"), "#backgroundDepthInput");
const characterDepthInput = requireElement(document.querySelector<HTMLInputElement>("#characterDepthInput"), "#characterDepthInput");
const propAssetSelect = requireElement(document.querySelector<HTMLSelectElement>("#propAssetSelect"), "#propAssetSelect");
const propDepthInput = requireElement(document.querySelector<HTMLInputElement>("#propDepthInput"), "#propDepthInput");
const effectAssetSelect = requireElement(document.querySelector<HTMLSelectElement>("#effectAssetSelect"), "#effectAssetSelect");
const effectDepthInput = requireElement(document.querySelector<HTMLInputElement>("#effectDepthInput"), "#effectDepthInput");
const propPlacementInputs = {
  x: requireElement(document.querySelector<HTMLInputElement>("#propXInput"), "#propXInput"),
  y: requireElement(document.querySelector<HTMLInputElement>("#propYInput"), "#propYInput"),
  width: requireElement(document.querySelector<HTMLInputElement>("#propWidthInput"), "#propWidthInput"),
  height: requireElement(document.querySelector<HTMLInputElement>("#propHeightInput"), "#propHeightInput"),
} satisfies ScenePlacementInputs;
const effectPlacementInputs = {
  x: requireElement(document.querySelector<HTMLInputElement>("#effectXInput"), "#effectXInput"),
  y: requireElement(document.querySelector<HTMLInputElement>("#effectYInput"), "#effectYInput"),
  width: requireElement(document.querySelector<HTMLInputElement>("#effectWidthInput"), "#effectWidthInput"),
  height: requireElement(document.querySelector<HTMLInputElement>("#effectHeightInput"), "#effectHeightInput"),
} satisfies ScenePlacementInputs;
const preview = requireElement(document.querySelector<HTMLElement>("#scenePreview"), "#scenePreview");
const output = requireElement(document.querySelector<HTMLElement>("#sceneOutput"), "#sceneOutput");
const status = requireElement(document.querySelector<HTMLElement>("#sceneStatus"), "#sceneStatus");
const saveButton = requireElement(document.querySelector<HTMLButtonElement>("#saveSceneButton"), "#saveSceneButton");

let savedAssetFiles: AssetFile[] = [];
let existingScenes: Record<string, RuntimeScene> = {};
let existingDefaultScene = "";

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
      message: "API가 JSON이 아닌 응답을 보냈어요. 서버가 다시 시작되었는지 확인하세요.",
    } as T;
  }
}

/**
 * Formats a saved asset option with its common or character scope.
 */
function createAssetLabel(assetFile: AssetFile) {
  const pathLabel = assetFile.path
    .replace("./src/characters/", "")
    .replace("./src/assets/common/", "common/");
  const prefix = assetFile.scope === "common" ? "공통 / " : "";

  return `${prefix}${pathLabel}`;
}

/**
 * Adds asset options grouped by character and common scope.
 */
function appendAssetOptionGroups(select: HTMLSelectElement, assetFiles: AssetFile[]) {
  const characterAssets = assetFiles.filter((assetFile) => assetFile.scope !== "common");
  const commonAssets = assetFiles.filter((assetFile) => assetFile.scope === "common");

  [
    ["캐릭터 에셋", characterAssets],
    ["공통 에셋", commonAssets],
  ].forEach(([label, files]) => {
    if (!Array.isArray(files) || files.length === 0) {
      return;
    }

    const group = document.createElement("optgroup");

    group.label = `${label} (${files.length})`;
    files.forEach((assetFile) => {
      group.append(new Option(createAssetLabel(assetFile), assetFile.path));
    });
    select.append(group);
  });
}

/**
 * Renders reusable scene asset choices for background, prop, and effect slots.
 */
function renderAssetOptions() {
  const sceneAssets = savedAssetFiles.filter((assetFile) => assetFile.kind === "scene");
  const sceneAndPartAssets = savedAssetFiles.filter((assetFile) => assetFile.kind === "scene" || assetFile.kind === "part");

  backgroundAssetSelect.replaceChildren(new Option(sceneAssets.length > 0 ? "배경 이미지 없음" : "assets/scenes 이미지가 없어요.", ""));
  propAssetSelect.replaceChildren(new Option(sceneAndPartAssets.length > 0 ? "소품 이미지 없음" : "scene/parts 이미지가 없어요.", ""));
  effectAssetSelect.replaceChildren(new Option(sceneAndPartAssets.length > 0 ? "FX 이미지 없음" : "scene/parts 이미지가 없어요.", ""));
  appendAssetOptionGroups(backgroundAssetSelect, sceneAssets);
  appendAssetOptionGroups(propAssetSelect, sceneAndPartAssets);
  appendAssetOptionGroups(effectAssetSelect, sceneAndPartAssets);
}

/**
 * Reads a numeric input while falling back to a stable scene default.
 */
function readNumber(input: HTMLInputElement, fallback: number) {
  const value = Number(input.value);

  return Number.isFinite(value) ? value : fallback;
}

/**
 * Converts four placement inputs into the percent placement used by runtime scenes.
 */
function readPlacement(inputs: ScenePlacementInputs) {
  return {
    x: readNumber(inputs.x, 0),
    y: readNumber(inputs.y, 0),
    width: readNumber(inputs.width, 100),
    height: readNumber(inputs.height, 100),
    unit: "percent" as const,
  };
}

/**
 * Creates the scene snippet that is previewed and sent to the dev server.
 */
function createSceneSnippet() {
  const sceneId = sceneIdInput.value.trim() || "desk-room";
  const layers: RuntimeSceneLayer[] = [];
  const backgroundImage = backgroundAssetSelect.value;
  const backgroundColor = backgroundColorInput.value.trim();
  const propImage = propAssetSelect.value;
  const effectImage = effectAssetSelect.value;

  if (backgroundImage || backgroundColor) {
    layers.push({
      id: "background",
      role: "background",
      depth: readNumber(backgroundDepthInput, 0),
      ...(backgroundImage ? { image: backgroundImage } : {}),
      ...(backgroundColor ? { color: backgroundColor } : {}),
    });
  }

  layers.push({
    id: "character-slot",
    role: "character",
    depth: readNumber(characterDepthInput, 20),
  });

  if (propImage) {
    layers.push({
      id: "desk-prop",
      role: "prop",
      image: propImage,
      depth: readNumber(propDepthInput, 30),
      placement: readPlacement(propPlacementInputs),
    });
  }

  if (effectImage) {
    layers.push({
      id: "scene-effect",
      role: "effect",
      image: effectImage,
      depth: readNumber(effectDepthInput, 40),
      placement: readPlacement(effectPlacementInputs),
    });
  }

  return {
    sceneId,
    defaultScene: defaultSceneInput.checked,
    scene: {
      id: sceneId,
      layers,
    } satisfies RuntimeScene,
  };
}

/**
 * Applies placement values to a preview layer element.
 */
function applyPreviewPlacement(element: HTMLElement, layer: RuntimeSceneLayer) {
  if (!layer.placement) {
    element.style.inset = "0";
    return;
  }

  element.style.left = `${layer.placement.x}%`;
  element.style.top = `${layer.placement.y}%`;
  element.style.width = `${layer.placement.width}%`;
  element.style.height = `${layer.placement.height}%`;
}

/**
 * Creates one visual preview node for a scene layer.
 */
function createPreviewLayer(layer: RuntimeSceneLayer) {
  const element = document.createElement("div");

  element.className = "asset-scene-preview-layer";
  element.style.zIndex = String(layer.depth ?? 0);
  applyPreviewPlacement(element, layer);

  if (layer.color) {
    element.style.background = layer.color;
  }

  if (layer.role === "character") {
    element.classList.add("asset-scene-character-slot");
    element.textContent = "character";
    element.style.left = "42%";
    element.style.top = "26%";
    element.style.width = "20%";
    element.style.height = "58%";
  }

  if (layer.image) {
    const image = document.createElement("img");

    image.src = layer.image;
    image.alt = layer.alt ?? layer.id;
    element.append(image);
  }

  return element;
}

/**
 * Refreshes the scene preview and JSON output.
 */
function renderOutputs() {
  const sceneSnippet = createSceneSnippet();

  preview.replaceChildren();
  sceneSnippet.scene.layers
    .slice()
    .sort((current, next) => (current.depth ?? 0) - (next.depth ?? 0))
    .forEach((layer) => {
      preview.append(createPreviewLayer(layer));
    });

  output.textContent = JSON.stringify({
    defaultScene: sceneSnippet.defaultScene ? sceneSnippet.sceneId : existingDefaultScene,
    scenePath: `assets.scenes[${JSON.stringify(sceneSnippet.sceneId)}]`,
    scene: sceneSnippet.scene,
  }, null, 2);
}

/**
 * Finds the first layer for a scene role.
 */
function findLayer(scene: RuntimeScene | undefined, role: RuntimeSceneLayer["role"]) {
  return scene?.layers.find((layer) => layer.role === role);
}

/**
 * Writes placement values back into the edit fields.
 */
function applyPlacement(inputs: ScenePlacementInputs, layer: RuntimeSceneLayer | undefined, fallback: RuntimeSceneLayer["placement"]) {
  const placement = layer?.placement ?? fallback;

  inputs.x.value = String(placement?.x ?? 0);
  inputs.y.value = String(placement?.y ?? 0);
  inputs.width.value = String(placement?.width ?? 100);
  inputs.height.value = String(placement?.height ?? 100);
}

/**
 * Applies the selected existing scene to the form.
 */
function applySceneSelection() {
  if (sceneSelect.value === newSceneSelectValue) {
    sceneIdInput.value = sceneIdInput.value.trim() || "desk-room";
    defaultSceneInput.checked = !existingDefaultScene;
    backgroundAssetSelect.value = "";
    backgroundColorInput.value = "";
    backgroundDepthInput.value = "0";
    characterDepthInput.value = "20";
    propAssetSelect.value = "";
    propDepthInput.value = "30";
    effectAssetSelect.value = "";
    effectDepthInput.value = "40";
    applyPlacement(propPlacementInputs, undefined, { x: 20, y: 74, width: 80, height: 25, unit: "percent" });
    applyPlacement(effectPlacementInputs, undefined, { x: 0, y: 0, width: 100, height: 100, unit: "percent" });
    renderOutputs();
    return;
  }

  const scene = existingScenes[sceneSelect.value];
  const backgroundLayer = findLayer(scene, "background");
  const characterLayer = findLayer(scene, "character");
  const propLayer = findLayer(scene, "prop");
  const effectLayer = findLayer(scene, "effect");

  sceneIdInput.value = scene?.id ?? sceneSelect.value;
  defaultSceneInput.checked = existingDefaultScene === sceneSelect.value;
  backgroundAssetSelect.value = backgroundLayer?.image ?? "";
  backgroundColorInput.value = backgroundLayer?.color ?? "";
  backgroundDepthInput.value = String(backgroundLayer?.depth ?? 0);
  characterDepthInput.value = String(characterLayer?.depth ?? 20);
  propAssetSelect.value = propLayer?.image ?? "";
  propDepthInput.value = String(propLayer?.depth ?? 30);
  effectAssetSelect.value = effectLayer?.image ?? "";
  effectDepthInput.value = String(effectLayer?.depth ?? 40);
  applyPlacement(propPlacementInputs, propLayer, { x: 20, y: 74, width: 80, height: 25, unit: "percent" });
  applyPlacement(effectPlacementInputs, effectLayer, { x: 0, y: 0, width: 100, height: 100, unit: "percent" });
  renderOutputs();
}

/**
 * Renders the existing scene selector.
 */
function renderSceneOptions() {
  const currentValue = sceneSelect.value;

  sceneSelect.replaceChildren(new Option("새 Scene 만들기", newSceneSelectValue));
  Object.values(existingScenes)
    .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: "base" }))
    .forEach((scene) => {
      const label = scene.id === existingDefaultScene ? `${scene.id} / default` : scene.id;

      sceneSelect.append(new Option(label, scene.id));
    });

  if (currentValue && Array.from(sceneSelect.options).some((option) => option.value === currentValue)) {
    sceneSelect.value = currentValue;
  }
}

/**
 * Loads reusable scene and common assets for the selected character.
 */
async function loadSavedAssetFiles() {
  const characterId = characterSelect.value || "rine";
  const response = await fetch(`/api/devtools/asset-files?characterId=${encodeURIComponent(characterId)}`);
  const result = await readApiJson<AssetFilesResponse>(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? result.error ?? "저장된 에셋 목록을 불러오지 못했어요.");
  }

  savedAssetFiles = result.files ?? [];
  renderAssetOptions();
}

/**
 * Loads scene settings from the selected character.
 */
async function loadCharacterAssets() {
  const characterId = characterSelect.value || "rine";
  const response = await fetch(`/api/devtools/character-assets?characterId=${encodeURIComponent(characterId)}`);
  const result = await readApiJson<CharacterAssetsResponse>(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? result.error ?? "캐릭터 Scene 정보를 불러오지 못했어요.");
  }

  existingScenes = result.assets?.scenes ?? {};
  existingDefaultScene = result.assets?.defaultScene ?? "";
  await loadSavedAssetFiles();
  renderSceneOptions();
  applySceneSelection();
  status.textContent = `${characterId} 캐릭터의 Scene 정보를 불러왔어요.`;
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
 * Validates the scene before saving it into character assets.
 */
function validateSceneSnippet(sceneSnippet: ReturnType<typeof createSceneSnippet>) {
  if (!sceneSnippet.sceneId) {
    return "Scene ID를 입력하세요.";
  }

  if (!sceneSnippet.scene.layers.some((layer) => layer.role === "character")) {
    return "Scene에는 character 위치가 필요해요.";
  }

  if (!sceneSnippet.scene.layers.some((layer) => layer.role !== "character" && (layer.image || layer.color))) {
    return "배경색이나 이미지, 소품, FX 중 하나는 넣어주세요.";
  }

  return null;
}

/**
 * Saves the current scene into the selected character assets.
 */
async function saveSceneConfig() {
  const sceneSnippet = createSceneSnippet();
  const validationMessage = validateSceneSnippet(sceneSnippet);

  if (validationMessage) {
    status.textContent = validationMessage;
    return;
  }

  saveButton.disabled = true;
  status.textContent = "Scene을 저장하는 중이에요.";

  try {
    const response = await fetch("/api/devtools/save-character-scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: characterSelect.value || "rine",
        scene: sceneSnippet,
      }),
    });
    const result = await readApiJson<SceneSaveResponse>(response);

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `Scene 저장 실패: ${result.error ?? response.status}`;
      return;
    }

    await loadCharacterAssets();
    sceneSelect.value = sceneSnippet.sceneId;
    status.textContent = `${result.saved?.path ?? "character index.ts"}에 Scene을 저장했어요.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Scene 저장 요청에 실패했어요.";
  } finally {
    saveButton.disabled = false;
    renderOutputs();
  }
}

/**
 * Wires the Scene settings page.
 */
function init() {
  characterSelect.addEventListener("change", () => {
    void loadCharacterAssets();
  });
  sceneSelect.addEventListener("change", applySceneSelection);
  [
    sceneIdInput,
    defaultSceneInput,
    backgroundAssetSelect,
    backgroundColorInput,
    backgroundDepthInput,
    characterDepthInput,
    propAssetSelect,
    propDepthInput,
    effectAssetSelect,
    effectDepthInput,
    ...Object.values(propPlacementInputs),
    ...Object.values(effectPlacementInputs),
  ].forEach((input) => {
    input.addEventListener("input", renderOutputs);
    input.addEventListener("change", renderOutputs);
  });
  saveButton.addEventListener("click", () => {
    void saveSceneConfig();
  });

  void loadCharacters();
}

init();
