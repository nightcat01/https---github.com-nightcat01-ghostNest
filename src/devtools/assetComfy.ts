import {
  createCropDataUrl,
  createFullMaskDataUrl,
  downloadDataUrl,
  LabImage,
  loadStoredRegion,
  PartRecipeId,
  readImageFile,
  recipes,
  requireElement,
  saveStoredRegion,
  TargetRegion,
} from "./assetShared.js";
import { createDevtoolsApiPath } from "./assetApi.js";

type GenerationResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  generation?: {
    images?: Array<{ fileName: string; dataUrl: string }>;
  };
};

let baseImage: LabImage | null = null;
let generatedImages: Array<{ fileName: string; dataUrl: string }> = [];
let currentRegion = loadStoredRegion(recipes.eyeBlink.defaultTargetRegion);

const recipeSelect = requireElement(document.querySelector<HTMLSelectElement>("#partRecipeSelect"), "#partRecipeSelect");
const baseImageInput = requireElement(document.querySelector<HTMLInputElement>("#baseImageInput"), "#baseImageInput");
const outputPrefixInput = requireElement(document.querySelector<HTMLInputElement>("#outputPrefixInput"), "#outputPrefixInput");
const checkpointInput = requireElement(document.querySelector<HTMLInputElement>("#checkpointNameInput"), "#checkpointNameInput");
const promptInput = requireElement(document.querySelector<HTMLTextAreaElement>("#promptInput"), "#promptInput");
const negativePromptInput = requireElement(document.querySelector<HTMLTextAreaElement>("#negativePromptInput"), "#negativePromptInput");
const generateButton = requireElement(document.querySelector<HTMLButtonElement>("#generateButton"), "#generateButton");
const downloadButton = requireElement(document.querySelector<HTMLButtonElement>("#downloadGeneratedButton"), "#downloadGeneratedButton");
const preview = requireElement(document.querySelector<HTMLElement>("#comfyPreview"), "#comfyPreview");
const status = requireElement(document.querySelector<HTMLElement>("#comfyStatus"), "#comfyStatus");
const regionInputs = {
  x: requireElement(document.querySelector<HTMLInputElement>("#targetRegionXInput"), "#targetRegionXInput"),
  y: requireElement(document.querySelector<HTMLInputElement>("#targetRegionYInput"), "#targetRegionYInput"),
  width: requireElement(document.querySelector<HTMLInputElement>("#targetRegionWidthInput"), "#targetRegionWidthInput"),
  height: requireElement(document.querySelector<HTMLInputElement>("#targetRegionHeightInput"), "#targetRegionHeightInput"),
};

/**
 * Reads and persists the selected region shared with crop/layer pages.
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
 * Updates prompt defaults from the selected recipe.
 */
function applyRecipeDefaults() {
  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;

  currentRegion = recipe.defaultTargetRegion;
  promptInput.value = recipe.prompt;
  negativePromptInput.value = recipe.negativePrompt;
  saveStoredRegion(currentRegion);
  renderRegionControls();
  renderPreview();
}

/**
 * Mirrors the selected region into numeric controls.
 */
function renderRegionControls() {
  regionInputs.x.value = String(currentRegion.x);
  regionInputs.y.value = String(currentRegion.y);
  regionInputs.width.value = String(currentRegion.width);
  regionInputs.height.value = String(currentRegion.height);
}

/**
 * Renders generated Comfy results or the base crop preview.
 */
function renderPreview() {
  preview.replaceChildren();

  if (generatedImages.length > 0) {
    generatedImages.forEach((generated) => {
      const image = document.createElement("img");
      image.className = "asset-comfy-result-image";
      image.src = generated.dataUrl;
      image.alt = generated.fileName;
      preview.append(image);
    });
    return;
  }

  const empty = document.createElement("p");
  empty.className = "asset-composite-placeholder";
  empty.textContent = baseImage
    ? "생성 버튼을 누르면 결과가 여기에 표시돼요."
    : "기준 이미지를 선택하고 ComfyUI 생성을 실행하세요.";
  preview.append(empty);
}

/**
 * Sends the selected crop context to the GhostNest Comfy bridge.
 */
async function generateWithComfy() {
  if (!baseImage) {
    status.textContent = "먼저 기준 이미지를 선택해야 해요.";
    return;
  }

  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;
  const region = readRegion();
  const cropDataUrl = await createCropDataUrl(baseImage.dataUrl, region);
  const maskDataUrl = await createFullMaskDataUrl(cropDataUrl);

  generateButton.disabled = true;
  status.textContent = "ComfyUI bridge에 생성 요청을 보내는 중이에요.";

  try {
    const response = await fetch(createDevtoolsApiPath("/api/devtools/generate-layer-part"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipeId: recipe.id,
        characterId: "character",
        outputPrefix: outputPrefixInput.value.trim() || recipe.id,
        outputNames: recipe.outputNames,
        outputPrompts: recipe.outputPrompts,
        prompt: promptInput.value.trim() || recipe.prompt,
        negativePrompt: negativePromptInput.value.trim() || recipe.negativePrompt,
        checkpointName: checkpointInput.value.trim() || "animagine-xl-4.0-opt.safetensors",
        modelProfile: "sdxl-general",
        editScope: "narrow",
        baseImageFileName: baseImage.fileName,
        baseImageDataUrl: baseImage.dataUrl,
        croppedBaseImageDataUrl: cropDataUrl,
        maskImageDataUrl: maskDataUrl,
        targetRegion: region,
        workflowSource: { mode: "serverFile", modelProfile: "sdxl-general", editScope: "narrow" },
      }),
    });
    const result = await response.json() as GenerationResponse;

    if (!response.ok || !result.ok) {
      status.textContent = result.message ?? `생성 실패: ${result.error ?? response.status}`;
      return;
    }

    generatedImages = result.generation?.images ?? [];
    status.textContent = `${generatedImages.length}개 결과를 받았어요.`;
    renderPreview();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "생성 요청에 실패했어요.";
  } finally {
    generateButton.disabled = false;
  }
}

/**
 * Downloads all generated Comfy result images.
 */
function downloadGenerated() {
  if (generatedImages.length === 0) {
    status.textContent = "다운로드할 생성 결과가 없어요.";
    return;
  }

  generatedImages.forEach((image) => downloadDataUrl(image.dataUrl, image.fileName));
  status.textContent = `${generatedImages.length}개 생성 결과 다운로드를 시작했어요.`;
}

/**
 * Wires Comfy page controls.
 */
function init() {
  applyRecipeDefaults();
  recipeSelect.addEventListener("change", applyRecipeDefaults);
  Object.values(regionInputs).forEach((input) => {
    input.addEventListener("input", () => {
      readRegion();
    });
  });
  baseImageInput.addEventListener("change", async () => {
    const file = baseImageInput.files?.[0];
    baseImage = file ? await readImageFile(file) : null;
    generatedImages = [];
    renderPreview();
  });
  generateButton.addEventListener("click", () => {
    void generateWithComfy();
  });
  downloadButton.addEventListener("click", downloadGenerated);
}

init();
