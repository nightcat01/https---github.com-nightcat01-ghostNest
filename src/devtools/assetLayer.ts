import {
  LabImage,
  loadStoredRegion,
  PartRecipeId,
  readImageFile,
  recipes,
  requireElement,
  resolveAssetPath,
  saveStoredRegion,
  TargetRegion,
} from "./assetShared.js";

type SaveResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  saved?: Array<{ fileName: string; path: string }> | {
    characterId: string;
    path: string;
    surfaceId: string;
    layerId: string;
  };
};
type DeleteResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  deleted?: CharacterLayerSaveTarget;
};
type CharacterLayerSaveTarget = {
  characterId: string;
  path: string;
  buildPath?: string | null;
  surfaceId: string;
  layerId: string;
};

type CharacterListResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  characters?: string[];
};
type LayerImage = LabImage & { assetPath?: string };
type RegionDragMode = "move" | "resize-nw" | "resize-ne" | "resize-se" | "resize-sw";
type RegionDragState = {
  mode: RegionDragMode;
  startClientX: number;
  startClientY: number;
  stageRect: DOMRect;
  startRegion: TargetRegion;
};
type ExistingLayer = {
  surfaceId: string;
  layerId: string;
  depth?: number;
  surfaceImage?: string;
  image?: string;
  frames?: string[];
  intervalMs?: number;
  idleIntervalMs?: number;
  coversBase?: boolean;
  placement?: TargetRegion;
};
type ExistingSurface = {
  surfaceId: string;
  image?: string;
  expression?: string;
  alt?: string;
  layerCount: number;
};
type CharacterAssetsResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  assets?: {
    surfaces?: Record<string, {
      id?: string;
      image?: string;
      expression?: string;
      alt?: string;
      layers?: Record<string, {
        image?: string;
        frames?: string[];
        depth?: number;
        intervalMs?: number;
        idleIntervalMs?: number;
        coversBase?: boolean;
        placement?: TargetRegion;
      }>;
    }>;
  };
};

/**
 * Reads an API response and turns non-JSON server errors into a usable message.
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
      message: `API가 JSON 대신 "${text.slice(0, 80)}" 응답을 보냈어요. 서버를 재시작했는지 확인하세요.`,
    } as T;
  }
}

let partImages: LayerImage[] = [];
let baseImage: LabImage | null = null;
let existingSurfaces: ExistingSurface[] = [];
let existingLayers: ExistingLayer[] = [];
let currentRegion = loadStoredRegion(recipes.eyeBlink.defaultTargetRegion);
let selectedFrameIndex = 0;
let isPreviewingBaseFrame = false;
let playTimerId: number | null = null;
let regionDragState: RegionDragState | null = null;
const layerSettingsStorageKey = "ghost-nest.asset-layer.settings.v1";
const newLayerSelectValue = "__new__";
const newSurfaceSelectValue = "__new_surface__";
const fallbackLayerDepths: Record<string, number> = {
  base: 0,
  ears: 10,
  eyes: 20,
  mouth: 30,
  accessory: 40,
};

const characterIdInput = requireElement(document.querySelector<HTMLInputElement>("#characterIdInput"), "#characterIdInput");
const characterSelect = requireElement(document.querySelector<HTMLSelectElement>("#characterSelect"), "#characterSelect");
const surfaceSelect = requireElement(document.querySelector<HTMLSelectElement>("#surfaceSelect"), "#surfaceSelect");
const recipeSelect = requireElement(document.querySelector<HTMLSelectElement>("#partRecipeSelect"), "#partRecipeSelect");
const existingLayerSelect = requireElement(document.querySelector<HTMLSelectElement>("#existingLayerSelect"), "#existingLayerSelect");
const surfaceSelectField = requireElement(document.querySelector<HTMLElement>("#surfaceSelectField"), "#surfaceSelectField");
const layerSelectField = requireElement(document.querySelector<HTMLElement>("#layerSelectField"), "#layerSelectField");
const partRecipeField = requireElement(document.querySelector<HTMLElement>("#partRecipeField"), "#partRecipeField");
const surfaceIdField = requireElement(document.querySelector<HTMLElement>("#surfaceIdField"), "#surfaceIdField");
const layerConfigFields = requireElement(document.querySelector<HTMLElement>("#layerConfigFields"), "#layerConfigFields");
const coversBaseField = requireElement(document.querySelector<HTMLElement>("#coversBaseField"), "#coversBaseField");
const layerStorageSection = requireElement(document.querySelector<HTMLElement>("#layerStorageSection"), "#layerStorageSection");
const layerPreviewSection = requireElement(document.querySelector<HTMLElement>("#layerPreviewSection"), "#layerPreviewSection");
const layerOutputSection = requireElement(document.querySelector<HTMLElement>("#layerOutputSection"), "#layerOutputSection");
const basePathInput = requireElement(document.querySelector<HTMLInputElement>("#basePathInput"), "#basePathInput");
const saveDirectoryInput = requireElement(document.querySelector<HTMLInputElement>("#saveDirectoryInput"), "#saveDirectoryInput");
const surfaceIdInput = requireElement(document.querySelector<HTMLInputElement>("#surfaceIdInput"), "#surfaceIdInput");
const layerIdSelect = requireElement(document.querySelector<HTMLSelectElement>("#layerIdSelect"), "#layerIdSelect");
const customLayerIdField = requireElement(document.querySelector<HTMLElement>("#customLayerIdField"), "#customLayerIdField");
const customLayerIdInput = requireElement(document.querySelector<HTMLInputElement>("#customLayerIdInput"), "#customLayerIdInput");
const intervalInput = requireElement(document.querySelector<HTMLInputElement>("#intervalInput"), "#intervalInput");
const idleIntervalInput = requireElement(document.querySelector<HTMLInputElement>("#idleIntervalInput"), "#idleIntervalInput");
const coversBaseInput = requireElement(document.querySelector<HTMLInputElement>("#coversBaseInput"), "#coversBaseInput");
const baseImageInput = requireElement(document.querySelector<HTMLInputElement>("#baseImageInput"), "#baseImageInput");
const partImagesInput = requireElement(document.querySelector<HTMLInputElement>("#partImagesInput"), "#partImagesInput");
const layerPreview = requireElement(document.querySelector<HTMLElement>("#layerPreview"), "#layerPreview");
const layerSummary = requireElement(document.querySelector<HTMLElement>("#layerSummary"), "#layerSummary");
const layerOutput = requireElement(document.querySelector<HTMLElement>("#layerSnippetOutput"), "#layerSnippetOutput");
const manifestOutput = requireElement(document.querySelector<HTMLElement>("#manifestOutput"), "#manifestOutput");
const status = requireElement(document.querySelector<HTMLElement>("#layerStatus"), "#layerStatus");
const saveButton = requireElement(document.querySelector<HTMLButtonElement>("#saveLayerConfigButton"), "#saveLayerConfigButton");
const deleteButton = requireElement(document.querySelector<HTMLButtonElement>("#deleteLayerConfigButton"), "#deleteLayerConfigButton");
const copyLayerButton = requireElement(document.querySelector<HTMLButtonElement>("#copyLayerButton"), "#copyLayerButton");
const copyManifestButton = requireElement(document.querySelector<HTMLButtonElement>("#copyManifestButton"), "#copyManifestButton");
const previousFrameButton = requireElement(document.querySelector<HTMLButtonElement>("#previousFrameButton"), "#previousFrameButton");
const playFramesButton = requireElement(document.querySelector<HTMLButtonElement>("#playFramesButton"), "#playFramesButton");
const nextFrameButton = requireElement(document.querySelector<HTMLButtonElement>("#nextFrameButton"), "#nextFrameButton");
const regionInputs = {
  x: requireElement(document.querySelector<HTMLInputElement>("#targetRegionXInput"), "#targetRegionXInput"),
  y: requireElement(document.querySelector<HTMLInputElement>("#targetRegionYInput"), "#targetRegionYInput"),
  width: requireElement(document.querySelector<HTMLInputElement>("#targetRegionWidthInput"), "#targetRegionWidthInput"),
  height: requireElement(document.querySelector<HTMLInputElement>("#targetRegionHeightInput"), "#targetRegionHeightInput"),
};

type StoredLayerSettings = {
  recipeId?: PartRecipeId;
  characterId?: string;
  surfaceId?: string;
  layerId?: string;
  customLayerId?: string;
  intervalMs?: number;
  idleIntervalMs?: number;
  coversBase?: boolean;
  basePath?: string;
  saveDirectory?: string;
};

/**
 * Reads and stores the placement region used by the generated layer snippet.
 */
function readRegion(): TargetRegion {
  currentRegion = {
    x: Number(regionInputs.x.value),
    y: Number(regionInputs.y.value),
    width: Number(regionInputs.width.value),
    height: Number(regionInputs.height.value),
    unit: "percent",
  };
  saveStoredRegion(currentRegion);

  return currentRegion;
}

/**
 * Saves the current layer form values so reopening the page restores the last setup.
 */
function saveLayerSettings() {
  const settings: StoredLayerSettings = {
    recipeId: recipeSelect.value as PartRecipeId,
    characterId: characterSelect.value || characterIdInput.value,
    surfaceId: surfaceIdInput.value,
    layerId: layerIdSelect.value,
    customLayerId: customLayerIdInput.value,
    intervalMs: Number(intervalInput.value),
    idleIntervalMs: Number(idleIntervalInput.value),
    coversBase: coversBaseInput.checked,
    basePath: basePathInput.value,
    saveDirectory: saveDirectoryInput.value,
  };

  window.localStorage.setItem(layerSettingsStorageKey, JSON.stringify(settings));
}

/**
 * Applies saved layer form values from localStorage when they exist.
 */
function loadLayerSettings() {
  try {
    const rawValue = window.localStorage.getItem(layerSettingsStorageKey);
    const settings = rawValue ? JSON.parse(rawValue) as StoredLayerSettings : null;

    if (!settings) {
      return;
    }

    if (settings.recipeId && recipes[settings.recipeId]) {
      recipeSelect.value = settings.recipeId;
    }

    surfaceIdInput.value = settings.surfaceId ?? surfaceIdInput.value;
    characterIdInput.value = settings.characterId ?? characterIdInput.value;
    characterSelect.value = settings.characterId ?? characterSelect.value;
    layerIdSelect.value = settings.layerId ?? layerIdSelect.value;
    customLayerIdInput.value = settings.customLayerId ?? customLayerIdInput.value;
    intervalInput.value = String(settings.intervalMs ?? Number(intervalInput.value) ?? 4200);
    idleIntervalInput.value = String(settings.idleIntervalMs ?? Number(idleIntervalInput.value) ?? 0);
    coversBaseInput.checked = settings.coversBase ?? coversBaseInput.checked;
    basePathInput.value = settings.basePath ?? basePathInput.value;
    saveDirectoryInput.value = settings.saveDirectory ?? saveDirectoryInput.value;
  } catch {
    // 저장된 개발도구 설정이 깨져도 페이지 사용은 계속 가능해야 합니다.
  }
}

/**
 * Refreshes settings that are shared across crop, comfy, and layer pages.
 */
function syncSharedRegionFromStorage() {
  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;

  currentRegion = loadStoredRegion(recipe.defaultTargetRegion);
  renderRegionControls();
  renderOutputs();
}

/**
 * Updates region controls from the shared region state.
 */
function renderRegionControls() {
  regionInputs.x.value = String(currentRegion.x);
  regionInputs.y.value = String(currentRegion.y);
  regionInputs.width.value = String(currentRegion.width);
  regionInputs.height.value = String(currentRegion.height);
}

/**
 * Keeps dragged region values inside the preview stage.
 */
function clampRegion(region: TargetRegion): TargetRegion {
  const width = Math.min(100, Math.max(1, region.width));
  const height = Math.min(100, Math.max(1, region.height));
  const x = Math.min(100 - width, Math.max(0, region.x));
  const y = Math.min(100 - height, Math.max(0, region.y));

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
    unit: "percent",
  };
}

/**
 * Applies a region change from pointer controls and refreshes linked outputs.
 */
function applyRegion(region: TargetRegion) {
  currentRegion = clampRegion(region);
  saveStoredRegion(currentRegion);
  renderRegionControls();
  renderOutputs();
}

/**
 * Resizes the region from the requested corner while preserving the opposite corner.
 */
function resizeRegionFromPointer(mode: RegionDragMode, startRegion: TargetRegion, deltaX: number, deltaY: number) {
  const left = startRegion.x;
  const top = startRegion.y;
  const right = startRegion.x + startRegion.width;
  const bottom = startRegion.y + startRegion.height;

  if (mode === "resize-nw") {
    return {
      x: left + deltaX,
      y: top + deltaY,
      width: right - (left + deltaX),
      height: bottom - (top + deltaY),
      unit: "percent",
    } satisfies TargetRegion;
  }

  if (mode === "resize-ne") {
    return {
      x: left,
      y: top + deltaY,
      width: right + deltaX - left,
      height: bottom - (top + deltaY),
      unit: "percent",
    } satisfies TargetRegion;
  }

  if (mode === "resize-sw") {
    return {
      x: left + deltaX,
      y: top,
      width: right - (left + deltaX),
      height: bottom + deltaY - top,
      unit: "percent",
    } satisfies TargetRegion;
  }

  return {
    x: left,
    y: top,
    width: right + deltaX - left,
    height: bottom + deltaY - top,
    unit: "percent",
  } satisfies TargetRegion;
}

/**
 * Starts moving or resizing the placement box in the preview.
 */
function startRegionDrag(event: PointerEvent, stage: HTMLElement, mode: RegionDragMode) {
  event.preventDefault();
  stopPlayback();
  regionDragState = {
    mode,
    startClientX: event.clientX,
    startClientY: event.clientY,
    stageRect: stage.getBoundingClientRect(),
    startRegion: { ...currentRegion },
  };
}

/**
 * Updates the placement box while the pointer is dragging.
 */
function handleRegionDragMove(event: PointerEvent) {
  if (!regionDragState) {
    return;
  }

  const deltaX = ((event.clientX - regionDragState.startClientX) / regionDragState.stageRect.width) * 100;
  const deltaY = ((event.clientY - regionDragState.startClientY) / regionDragState.stageRect.height) * 100;
  const nextRegion = regionDragState.mode === "move"
    ? {
        ...regionDragState.startRegion,
        x: regionDragState.startRegion.x + deltaX,
        y: regionDragState.startRegion.y + deltaY,
      }
    : resizeRegionFromPointer(regionDragState.mode, regionDragState.startRegion, deltaX, deltaY);

  applyRegion(nextRegion);
}

/**
 * Ends the active placement drag interaction.
 */
function stopRegionDrag() {
  regionDragState = null;
}

/**
 * Returns the default layer id for the currently selected part recipe.
 */
function getRecipeLayerId(recipeId: PartRecipeId) {
  return recipeId === "mouthShapes" ? "mouth" : recipeId === "eyeBlink" ? "eyes" : "accessory";
}

/**
 * Returns default timing values for the selected layer recipe.
 */
function getRecipeTimingDefaults(recipeId: PartRecipeId) {
  if (recipeId === "mouthShapes") {
    return { intervalMs: 140, idleIntervalMs: 0 };
  }

  if (recipeId === "eyeBlink") {
    return { intervalMs: 120, idleIntervalMs: 4200 };
  }

  return { intervalMs: 160, idleIntervalMs: 2500 };
}

/**
 * Applies default input values when a user starts a new layer.
 */
function applyNewLayerDefaults() {
  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;
  const timing = getRecipeTimingDefaults(recipe.id);

  currentRegion = recipe.defaultTargetRegion;
  surfaceIdInput.value = surfaceIdInput.value.trim() || "0";
  layerIdSelect.value = getRecipeLayerId(recipe.id);
  intervalInput.value = String(timing.intervalMs);
  idleIntervalInput.value = String(timing.idleIntervalMs);
  coversBaseInput.checked = true;
  selectedFrameIndex = 0;
  isPreviewingBaseFrame = false;
  renderRegionControls();
}

/**
 * Checks whether the user has chosen an existing layer or the new-layer flow.
 */
function hasLayerSelection() {
  return existingLayerSelect.value !== "";
}

/**
 * Checks whether the user has selected an existing surface or the new-surface flow.
 */
function hasSurfaceSelection() {
  return surfaceSelect.value !== "";
}

/**
 * Shows layer detail controls only after the first selection step is complete.
 */
function renderLayerSelectionStep() {
  const hasCharacter = characterSelect.value !== "";
  const shouldShowSurface = hasCharacter;
  const shouldShowLayer = hasCharacter && hasSurfaceSelection();
  const shouldShowLayerDetails = hasSurfaceSelection() && hasLayerSelection();
  const shouldShowNewSurfaceInput = surfaceSelect.value === newSurfaceSelectValue;
  const shouldShowRecipe = existingLayerSelect.value === newLayerSelectValue;

  [
    layerConfigFields,
    coversBaseField,
    layerStorageSection,
    layerPreviewSection,
    layerOutputSection,
  ].forEach((element) => {
    element.hidden = !shouldShowLayerDetails;
  });
  surfaceSelectField.hidden = !shouldShowSurface;
  layerSelectField.hidden = !shouldShowLayer;
  surfaceIdField.hidden = !shouldShowNewSurfaceInput;
  partRecipeField.hidden = !shouldShowLayerDetails || !shouldShowRecipe;
  deleteButton.disabled = !getSelectedExistingLayer();
}

/**
 * Builds asset paths from selected local part files.
 */
function getPartPaths() {
  const basePath = basePathInput.value.trim() || "./src/characters/rine/generated/";

  return partImages.map((image) => image.assetPath ?? resolveAssetPath(basePath, image.fileName));
}

/**
 * Converts an asset path from the character config into a preview image record.
 */
function createAssetPathImage(assetPath: string): LayerImage {
  return {
    fileName: assetPath.split("/").pop() ?? assetPath,
    previewUrl: assetPath,
    dataUrl: assetPath,
    assetPath,
  };
}

/**
 * Resolves the visual depth used by the renderer when an explicit depth is absent.
 */
function getLayerDepth(layer: Pick<ExistingLayer, "depth" | "layerId">) {
  return layer.depth ?? fallbackLayerDepths[layer.layerId] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Keeps loaded layers aligned with surface id and render depth order.
 */
function sortExistingLayers(layers: ExistingLayer[]) {
  return [...layers].sort((left, right) => {
    const surfaceOrder = left.surfaceId.localeCompare(right.surfaceId, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    if (surfaceOrder !== 0) {
      return surfaceOrder;
    }

    const depthOrder = getLayerDepth(left) - getLayerDepth(right);

    if (depthOrder !== 0) {
      return depthOrder;
    }

    return left.layerId.localeCompare(right.layerId, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

/**
 * Keeps surfaces in numeric id order where possible.
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
 * Rebuilds the layer select for the currently selected surface.
 */
function renderLayerOptionsForSurface() {
  if (!hasSurfaceSelection()) {
    existingLayerSelect.replaceChildren(new Option("Surface를 먼저 선택하세요.", ""));
    return;
  }

  const surfaceId = surfaceSelect.value === newSurfaceSelectValue ? surfaceIdInput.value.trim() : surfaceSelect.value;
  const surfaceLayers = existingLayers.filter((layer) => layer.surfaceId === surfaceId);

  existingLayerSelect.replaceChildren(
    new Option("Layer 선택", ""),
    new Option("새 레이어 만들기", newLayerSelectValue),
  );
  surfaceLayers.forEach((layer) => {
    const layerIndex = existingLayers.indexOf(layer);
    const frameCount = layer.frames?.length ?? (layer.image ? 1 : 0);

    existingLayerSelect.append(new Option(`${layer.layerId} depth ${getLayerDepth(layer)} (${frameCount} frame)`, String(layerIndex)));
  });

  if (surfaceLayers.length === 0) {
    existingLayerSelect.value = newLayerSelectValue;
    applyNewLayerDefaults();
  }
}

/**
 * Reads the selected character definition and prepares surface choices.
 */
async function loadCharacterAssets() {
  const characterId = characterSelect.value || characterIdInput.value.trim() || "rine";

  characterIdInput.value = characterId;
  surfaceSelect.replaceChildren(new Option("Surface를 불러오는 중이에요.", ""));
  existingLayerSelect.replaceChildren(new Option("Surface를 먼저 선택하세요.", ""));
  existingSurfaces = [];
  existingLayers = [];
  renderOutputs();

  try {
    const response = await fetch(`/api/devtools/character-assets?characterId=${encodeURIComponent(characterId)}`);
    const result = await readApiJson<CharacterAssetsResponse>(response);

    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? result.error ?? "캐릭터 레이어 정보를 불러오지 못했어요.");
    }

    const surfaces = result.assets?.surfaces ?? {};

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
    existingLayers = sortExistingLayers(Object.entries(surfaces).flatMap(([surfaceId, surface]) =>
      Object.entries(surface.layers ?? {}).map(([layerId, layer]) => {
        const existingLayer: ExistingLayer = { surfaceId: surface.id ?? surfaceId, layerId };

        if (surface.image) {
          existingLayer.surfaceImage = surface.image;
        }

        if (layer.image) {
          existingLayer.image = layer.image;
        }

        if (layer.frames) {
          existingLayer.frames = layer.frames;
        }

        if (layer.depth !== undefined) {
          existingLayer.depth = layer.depth;
        }

        if (layer.intervalMs !== undefined) {
          existingLayer.intervalMs = layer.intervalMs;
        }

        if (layer.idleIntervalMs !== undefined) {
          existingLayer.idleIntervalMs = layer.idleIntervalMs;
        }

        if (layer.coversBase !== undefined) {
          existingLayer.coversBase = layer.coversBase;
        }

        if (layer.placement) {
          existingLayer.placement = layer.placement;
        }

        return existingLayer;
      }),
    ));

    surfaceSelect.replaceChildren(
      new Option("Surface 선택", ""),
      new Option("새 Surface 만들기", newSurfaceSelectValue),
    );
    existingSurfaces.forEach((surface) => {
      const labelParts = [
        surface.surfaceId,
        surface.expression ? `expression ${surface.expression}` : "",
        `${surface.layerCount} layer`,
      ].filter(Boolean);

      surfaceSelect.append(new Option(labelParts.join(" / "), surface.surfaceId));
    });

    if (existingSurfaces.length === 0) {
      surfaceSelect.value = newSurfaceSelectValue;
      surfaceIdInput.value = surfaceIdInput.value.trim() || "0";
      renderLayerOptionsForSurface();
    }

    renderOutputs();
    status.textContent = `${characterId} 캐릭터를 불러왔어요. Surface를 선택하세요.`;
  } catch (error) {
    surfaceSelect.replaceChildren(
      new Option("Surface를 불러오지 못했어요.", ""),
      new Option("새 Surface 만들기", newSurfaceSelectValue),
    );
    existingLayerSelect.replaceChildren(new Option("Surface를 먼저 선택하세요.", ""));
    renderOutputs();
    status.textContent = error instanceof Error ? error.message : "캐릭터 레이어 정보를 불러오지 못했어요.";
  }
}

/**
 * Loads available character ids from the dev server.
 */
async function loadCharacters() {
  const preferredCharacterId = characterIdInput.value.trim() || "rine";

  characterSelect.replaceChildren(new Option("캐릭터를 불러오는 중이에요.", ""));

  try {
    const response = await fetch("/api/devtools/characters");
    const result = await readApiJson<CharacterListResponse>(response);

    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? result.error ?? "캐릭터 목록을 불러오지 못했어요.");
    }

    const characters = result.characters ?? [];

    characterSelect.replaceChildren(new Option("캐릭터 선택", ""));
    characters.forEach((characterId) => {
      characterSelect.append(new Option(characterId, characterId));
    });

    characterSelect.value = characters.includes(preferredCharacterId)
      ? preferredCharacterId
      : characters[0] ?? "";

    if (characterSelect.value) {
      await loadCharacterAssets();
      return;
    }

    renderOutputs();
    status.textContent = "불러올 캐릭터가 없어요. 먼저 캐릭터 빌드 결과를 확인하세요.";
  } catch (error) {
    characterSelect.replaceChildren(new Option("캐릭터를 불러오지 못했어요.", ""));
    renderOutputs();
    status.textContent = error instanceof Error ? error.message : "캐릭터 목록을 불러오지 못했어요.";
  }
}

/**
 * Returns the existing layer currently selected in the layer picker.
 */
function getSelectedExistingLayer() {
  const selectedIndex = Number(existingLayerSelect.value);

  return Number.isInteger(selectedIndex) ? existingLayers[selectedIndex] ?? null : null;
}

/**
 * Applies a selected existing layer to the editor controls and preview state.
 */
function applyExistingLayer() {
  const existingLayer = getSelectedExistingLayer();

  if (!existingLayer) {
    return;
  }

  surfaceIdInput.value = existingLayer.surfaceId;

  if (["eyes", "mouth", "ears", "accessory"].includes(existingLayer.layerId)) {
    layerIdSelect.value = existingLayer.layerId;
  } else {
    layerIdSelect.value = "etc";
    customLayerIdInput.value = existingLayer.layerId;
  }

  intervalInput.value = String(existingLayer.intervalMs ?? Number(intervalInput.value) ?? 140);
  idleIntervalInput.value = String(existingLayer.idleIntervalMs ?? Number(idleIntervalInput.value) ?? 0);
  coversBaseInput.checked = existingLayer.coversBase ?? false;

  if (existingLayer.placement) {
    currentRegion = { ...existingLayer.placement, unit: "percent" };
    saveStoredRegion(currentRegion);
    renderRegionControls();
  }

  baseImage = existingLayer.surfaceImage ? createAssetPathImage(existingLayer.surfaceImage) : baseImage;
  partImages = [
    ...(existingLayer.frames ?? []),
    ...(existingLayer.image ? [existingLayer.image] : []),
  ].map(createAssetPathImage);
  selectedFrameIndex = 0;
  isPreviewingBaseFrame = false;
  renderOutputs();
}

/**
 * Applies the selected surface and prepares its layer list.
 */
function handleSurfaceSelectionChange() {
  stopPlayback();
  existingLayerSelect.value = "";
  partImages = [];
  selectedFrameIndex = 0;
  isPreviewingBaseFrame = false;

  if (!hasSurfaceSelection()) {
    baseImage = null;
    existingLayerSelect.replaceChildren(new Option("Surface를 먼저 선택하세요.", ""));
    renderOutputs();
    return;
  }

  if (surfaceSelect.value === newSurfaceSelectValue) {
    surfaceIdInput.value = surfaceIdInput.value.trim() || "0";
    baseImage = null;
    renderLayerOptionsForSurface();
    renderOutputs();
    status.textContent = "새 Surface에 추가할 레이어를 설정하세요.";
    return;
  }

  const surface = existingSurfaces.find((item) => item.surfaceId === surfaceSelect.value);

  surfaceIdInput.value = surfaceSelect.value;
  baseImage = surface?.image ? createAssetPathImage(surface.image) : null;
  renderLayerOptionsForSurface();
  renderOutputs();
  status.textContent = `${surfaceSelect.value} Surface의 Layer를 선택하세요.`;
}

/**
 * Starts a blank layer flow after the user chooses to create one.
 */
function startNewLayer() {
  applyNewLayerDefaults();
  renderOutputs();
  status.textContent = "새 레이어 설정을 만들 준비가 됐어요.";
}

/**
 * Routes the first selection step to either editing an existing layer or creating a new one.
 */
function handleLayerSelectionChange() {
  stopPlayback();

  if (existingLayerSelect.value === newLayerSelectValue) {
    startNewLayer();
    return;
  }

  if (!hasLayerSelection()) {
    renderOutputs();
    return;
  }

  applyExistingLayer();
}

/**
 * Returns the selected layer id, including a custom typed value.
 */
function getLayerId() {
  if (layerIdSelect.value !== "etc") {
    return layerIdSelect.value;
  }

  return customLayerIdInput.value.trim() || "etc";
}

/**
 * Creates a depth patch for known layer ids.
 */
function createLayerDepthPatch(layerId: string) {
  const depth = fallbackLayerDepths[layerId];

  return depth === undefined ? {} : { depth };
}

/**
 * Creates a layer snippet that can be copied into assets.surfaces[surfaceId].layers.
 */
function createLayerSnippet() {
  const partPaths = getPartPaths();
  const layerId = getLayerId();
  const idleIntervalMs = Number(idleIntervalInput.value) || 0;

  return {
    surfaceId: surfaceIdInput.value.trim() || "0",
    layerId,
    layer: {
      frames: partPaths,
      ...createLayerDepthPatch(layerId),
      intervalMs: Number(intervalInput.value) || 140,
      ...(idleIntervalMs > 0 ? { idleIntervalMs } : {}),
      coversBase: coversBaseInput.checked,
      placement: readRegion(),
    },
  };
}

/**
 * Creates a manifest patch preview for the selected surface and layer.
 */
function createManifestSnippet() {
  const layerSnippet = createLayerSnippet();

  return {
    surfaces: {
      [layerSnippet.surfaceId]: {
        layers: {
          [layerSnippet.layerId]: layerSnippet.layer,
        },
      },
    },
  };
}

/**
 * Normalizes the save response into a concrete character source target.
 */
function resolveSaveTarget(saved: SaveResponse["saved"], layerSnippet: ReturnType<typeof createLayerSnippet>): CharacterLayerSaveTarget {
  if (saved && !Array.isArray(saved)) {
    return saved;
  }

  const characterId = characterSelect.value || characterIdInput.value.trim() || "rine";

  return {
    characterId,
    path: `src/characters/${characterId}/index.ts`,
    buildPath: null,
    surfaceId: layerSnippet.surfaceId,
    layerId: layerSnippet.layerId,
  };
}

/**
 * Shows the exact source path and layer object that were saved.
 */
function renderSaveResult(saveTarget: CharacterLayerSaveTarget, layerSnippet: ReturnType<typeof createLayerSnippet>) {
  const layerPath = `assets.surfaces[${JSON.stringify(saveTarget.surfaceId)}].layers[${JSON.stringify(saveTarget.layerId)}]`;

  status.textContent = `${saveTarget.path} 저장 완료 · ${layerPath}`;
  manifestOutput.textContent = JSON.stringify({
    savedTo: saveTarget.path,
    refreshSource: saveTarget.buildPath ?? "dist build file was not found",
    characterId: saveTarget.characterId,
    layerPath,
    surfaceId: saveTarget.surfaceId,
    layerId: saveTarget.layerId,
  }, null, 2);
  layerOutput.textContent = JSON.stringify(layerSnippet, null, 2);
}

/**
 * Shows the exact source path and layer key that were deleted.
 */
function renderDeleteResult(deleteTarget: CharacterLayerSaveTarget) {
  const layerPath = `assets.surfaces[${JSON.stringify(deleteTarget.surfaceId)}].layers[${JSON.stringify(deleteTarget.layerId)}]`;

  status.textContent = `${deleteTarget.path} 삭제 완료 · ${layerPath}`;
  layerOutputSection.hidden = false;
  manifestOutput.textContent = JSON.stringify({
    deletedFrom: deleteTarget.path,
    refreshSource: deleteTarget.buildPath ?? "dist build file was not found",
    characterId: deleteTarget.characterId,
    layerPath,
    surfaceId: deleteTarget.surfaceId,
    layerId: deleteTarget.layerId,
  }, null, 2);
  layerOutput.textContent = "선택한 Layer 설정이 캐릭터 index.ts에서 삭제됐어요.";
}

/**
 * Shows the custom layer input only when direct entry is selected.
 */
function renderCustomLayerField() {
  const isCustomLayer = layerIdSelect.value === "etc";

  customLayerIdField.hidden = !isCustomLayer;
  customLayerIdField.style.display = isCustomLayer ? "grid" : "none";
}

/**
 * Renders a concise readable summary of the active layer settings.
 */
function renderSummary() {
  const snippet = createLayerSnippet();
  const currentFrame = isPreviewingBaseFrame
    ? baseImage?.fileName ?? "base"
    : partImages[selectedFrameIndex]?.fileName ?? "선택 없음";
  const rows: Array<[string, string]> = [
    ["Surface", snippet.surfaceId],
    ["Layer", snippet.layerId],
    ["Frames", `${partImages.length}개`],
    ["Frame", currentFrame],
    ["depth", String(snippet.layer.depth ?? getLayerDepth({ layerId: snippet.layerId }))],
    ["intervalMs", String(snippet.layer.intervalMs)],
    ["idleIntervalMs", String(snippet.layer.idleIntervalMs ?? 0)],
    ["coversBase", snippet.layer.coversBase ? "true" : "false"],
    ["placement", `x ${currentRegion.x}%, y ${currentRegion.y}%, w ${currentRegion.width}%, h ${currentRegion.height}%`],
  ];

  layerSummary.replaceChildren();
  rows.forEach(([label, value]) => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value;
    layerSummary.append(term, description);
  });
}

/**
 * Allows one overlay to preview as base -> overlay without changing saved frames.
 */
function canPreviewBaseFrame() {
  return Boolean(baseImage && coversBaseInput.checked && partImages.length > 0);
}

/**
 * Counts frames available to the preview controls.
 */
function getPreviewFrameCount() {
  return partImages.length + (canPreviewBaseFrame() ? 1 : 0);
}

/**
 * Converts the current visible preview frame to a control slot.
 */
function getPreviewSlotIndex() {
  if (!canPreviewBaseFrame()) {
    return selectedFrameIndex;
  }

  return isPreviewingBaseFrame ? 0 : selectedFrameIndex + 1;
}

/**
 * Applies a control slot back to preview state.
 */
function setPreviewSlotIndex(slotIndex: number) {
  const frameCount = getPreviewFrameCount();
  const nextSlotIndex = (slotIndex + frameCount) % frameCount;

  if (canPreviewBaseFrame() && nextSlotIndex === 0) {
    isPreviewingBaseFrame = true;
    return;
  }

  isPreviewingBaseFrame = false;
  selectedFrameIndex = canPreviewBaseFrame() ? nextSlotIndex - 1 : nextSlotIndex;
}

/**
 * Stops active preview playback and restores the button state.
 */
function stopPlayback() {
  if (playTimerId === null) {
    return;
  }

  window.clearInterval(playTimerId);
  playTimerId = null;
  playFramesButton.textContent = "재생";
}

/**
 * Renders the selected frame on top of the base image using placement values.
 */
function renderPreview() {
  const previewFrameCount = getPreviewFrameCount();
  const selectedPart = isPreviewingBaseFrame ? null : partImages[selectedFrameIndex] ?? null;
  layerPreview.replaceChildren();
  previousFrameButton.disabled = previewFrameCount <= 1;
  nextFrameButton.disabled = previewFrameCount <= 1;
  playFramesButton.disabled = previewFrameCount <= 1;

  if (previewFrameCount <= 1) {
    stopPlayback();
  }

  if (!baseImage && !selectedPart) {
    const empty = document.createElement("p");
    empty.className = "asset-composite-placeholder";
    empty.textContent = "기준 이미지와 파츠 이미지를 선택하면 실제 배치 느낌을 확인할 수 있어요.";
    layerPreview.append(empty);
    return;
  }

  const stage = document.createElement("div");
  stage.className = "asset-composite-stage";
  stage.style.setProperty("--asset-composite-width", "680px");

  if (baseImage) {
    const base = document.createElement("img");
    base.className = "asset-composite-base";
    base.src = baseImage.previewUrl;
    base.alt = "레이어 기준 이미지";
    stage.append(base);
  }

  if (selectedPart) {
    const overlay = document.createElement("img");
    overlay.className = "asset-composite-overlay";
    overlay.src = selectedPart.previewUrl;
    overlay.alt = selectedPart.fileName;
    overlay.style.left = `${currentRegion.x}%`;
    overlay.style.top = `${currentRegion.y}%`;
    overlay.style.width = `${currentRegion.width}%`;
    overlay.style.height = `${currentRegion.height}%`;
    stage.append(overlay);
  }

  const region = document.createElement("span");
  region.className = "asset-composite-region";
  region.title = "드래그해서 위치를 옮기고, 모서리를 드래그해서 크기를 조절하세요.";
  region.style.left = `${currentRegion.x}%`;
  region.style.top = `${currentRegion.y}%`;
  region.style.width = `${currentRegion.width}%`;
  region.style.height = `${currentRegion.height}%`;
  region.addEventListener("pointerdown", (event) => {
    startRegionDrag(event, stage, "move");
  });
  (["nw", "ne", "se", "sw"] as const).forEach((corner) => {
    const handle = document.createElement("span");

    handle.className = `asset-composite-region-handle asset-composite-region-handle-${corner}`;
    handle.dataset.regionHandle = corner;
    handle.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      startRegionDrag(event, stage, `resize-${corner}`);
    });
    region.append(handle);
  });
  stage.append(region);
  layerPreview.append(stage);
}

/**
 * Renders both layer and manifest JSON outputs.
 */
function renderOutputs() {
  renderLayerSelectionStep();
  renderCustomLayerField();
  selectedFrameIndex = Math.min(selectedFrameIndex, Math.max(0, partImages.length - 1));
  isPreviewingBaseFrame = canPreviewBaseFrame() ? isPreviewingBaseFrame : false;
  layerOutput.textContent = JSON.stringify(createLayerSnippet(), null, 2);
  manifestOutput.textContent = JSON.stringify(createManifestSnippet(), null, 2);
  renderSummary();
  renderPreview();
  saveLayerSettings();
}

/**
 * Saves the layer and manifest snippets as project files.
 */
async function saveLayerConfig() {
  const layerSnippet = createLayerSnippet();
  let savedResult: SaveResponse | null = null;

  saveButton.disabled = true;
  status.textContent = "캐릭터 레이어 설정을 저장하는 중이에요.";

  try {
    const response = await fetch("/api/devtools/save-character-layer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: characterSelect.value || characterIdInput.value,
        layer: layerSnippet,
      }),
    });
    const result = await readApiJson<SaveResponse>(response);
    savedResult = result;

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `저장 실패: ${result.error ?? response.status}`;
      return;
    }

    status.textContent = "캐릭터 index.ts에 레이어 설정을 저장했어요.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "저장 요청에 실패했어요.";
  } finally {
    if (savedResult?.ok) {
      await loadCharacterAssets();
      renderSaveResult(resolveSaveTarget(savedResult.saved, layerSnippet), layerSnippet);
    }

    saveButton.disabled = false;
  }
}

/**
 * Deletes the selected existing layer from the character source file.
 */
async function deleteLayerConfig() {
  const existingLayer = getSelectedExistingLayer();

  if (!existingLayer) {
    status.textContent = "삭제할 기존 Layer를 먼저 선택하세요.";
    return;
  }

  const characterId = characterSelect.value || characterIdInput.value;
  const confirmed = window.confirm(`${characterId} / Surface ${existingLayer.surfaceId} / Layer ${existingLayer.layerId} 설정을 삭제할까요?`);

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  status.textContent = "선택한 Layer 설정을 삭제하는 중이에요.";

  try {
    const response = await fetch("/api/devtools/delete-character-layer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId,
        surfaceId: existingLayer.surfaceId,
        layerId: existingLayer.layerId,
      }),
    });
    const result = await readApiJson<DeleteResponse>(response);

    if (!response.ok || !result.ok || !result.deleted) {
      status.textContent = result.message ?? `삭제 실패: ${result.error ?? response.status}`;
      return;
    }

    await loadCharacterAssets();
    renderDeleteResult(result.deleted);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "삭제 요청에 실패했어요.";
  } finally {
    deleteButton.disabled = !getSelectedExistingLayer();
  }
}

/**
 * Copies text to the clipboard and gives short button feedback.
 */
async function copyText(text: string, button: HTMLButtonElement, label: string) {
  await navigator.clipboard.writeText(text);
  button.textContent = "복사됨";
  window.setTimeout(() => {
    button.textContent = label;
  }, 1200);
}

/**
 * Moves the preview to a sibling frame.
 */
function moveFrame(offset: number) {
  const previewFrameCount = getPreviewFrameCount();

  if (previewFrameCount === 0) {
    selectedFrameIndex = 0;
    isPreviewingBaseFrame = false;
    renderOutputs();
    return;
  }

  setPreviewSlotIndex(getPreviewSlotIndex() + offset);
  renderOutputs();
}

/**
 * Starts or stops the frame animation preview.
 */
function togglePlayback() {
  if (playTimerId !== null) {
    stopPlayback();
    return;
  }

  if (getPreviewFrameCount() <= 1) {
    return;
  }

  const intervalMs = Math.max(40, Number(intervalInput.value) || 140);

  playTimerId = window.setInterval(() => {
    moveFrame(1);
  }, intervalMs);
  playFramesButton.textContent = "정지";
}

/**
 * Wires layer page controls.
 */
function init() {
  loadLayerSettings();
  renderRegionControls();
  renderOutputs();

  recipeSelect.addEventListener("change", () => {
    const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;
    const timing = getRecipeTimingDefaults(recipe.id);

    currentRegion = recipe.defaultTargetRegion;
    layerIdSelect.value = getRecipeLayerId(recipe.id);
    intervalInput.value = String(timing.intervalMs);
    idleIntervalInput.value = String(timing.idleIntervalMs);
    renderRegionControls();
    renderOutputs();
  });
  partImagesInput.addEventListener("change", async () => {
    const files = Array.from(partImagesInput.files ?? []);
    partImages = await Promise.all(files.map(readImageFile));
    selectedFrameIndex = 0;
    isPreviewingBaseFrame = false;
    renderOutputs();
  });
  baseImageInput.addEventListener("change", async () => {
    const file = baseImageInput.files?.[0];
    baseImage = file ? await readImageFile(file) : null;
    renderOutputs();
  });
  [
    basePathInput,
    saveDirectoryInput,
    surfaceIdInput,
    layerIdSelect,
    customLayerIdInput,
    intervalInput,
    idleIntervalInput,
    coversBaseInput,
    ...Object.values(regionInputs),
  ].forEach((input) => {
    input.addEventListener("input", renderOutputs);
    input.addEventListener("change", renderOutputs);
  });
  characterSelect.addEventListener("change", () => {
    void loadCharacterAssets();
  });
  surfaceSelect.addEventListener("change", handleSurfaceSelectionChange);
  existingLayerSelect.addEventListener("change", handleLayerSelectionChange);
  window.addEventListener("pointermove", handleRegionDragMove);
  window.addEventListener("pointerup", stopRegionDrag);
  window.addEventListener("pointercancel", stopRegionDrag);
  window.addEventListener("focus", syncSharedRegionFromStorage);
  window.addEventListener("storage", (event) => {
    if (event.key === "ghost-nest.asset-generator.target-region.v1" || event.key === layerSettingsStorageKey) {
      loadLayerSettings();
      syncSharedRegionFromStorage();
    }
  });
  saveButton.addEventListener("click", () => {
    void saveLayerConfig();
  });
  deleteButton.addEventListener("click", () => {
    void deleteLayerConfig();
  });
  copyLayerButton.addEventListener("click", () => {
    void copyText(layerOutput.textContent ?? "", copyLayerButton, "Layer 복사");
  });
  copyManifestButton.addEventListener("click", () => {
    void copyText(manifestOutput.textContent ?? "", copyManifestButton, "Manifest 복사");
  });
  previousFrameButton.addEventListener("click", () => moveFrame(-1));
  nextFrameButton.addEventListener("click", () => moveFrame(1));
  playFramesButton.addEventListener("click", togglePlayback);
  void loadCharacters();
}

init();
