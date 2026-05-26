import {
  createCropDataUrl,
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

let baseImage: LabImage | null = null;
let currentRegion = loadStoredRegion(recipes.eyeBlink.defaultTargetRegion);

const recipeSelect = requireElement(document.querySelector<HTMLSelectElement>("#partRecipeSelect"), "#partRecipeSelect");
const baseImageInput = requireElement(document.querySelector<HTMLInputElement>("#baseImageInput"), "#baseImageInput");
const preview = requireElement(document.querySelector<HTMLElement>("#cropPreview"), "#cropPreview");
const status = requireElement(document.querySelector<HTMLElement>("#cropStatus"), "#cropStatus");
const downloadButton = requireElement(document.querySelector<HTMLButtonElement>("#downloadCropButton"), "#downloadCropButton");
const regionInputs = {
  x: requireElement(document.querySelector<HTMLInputElement>("#targetRegionXInput"), "#targetRegionXInput"),
  y: requireElement(document.querySelector<HTMLInputElement>("#targetRegionYInput"), "#targetRegionYInput"),
  width: requireElement(document.querySelector<HTMLInputElement>("#targetRegionWidthInput"), "#targetRegionWidthInput"),
  height: requireElement(document.querySelector<HTMLInputElement>("#targetRegionHeightInput"), "#targetRegionHeightInput"),
};

/**
 * Reads the current region controls and stores them for the other asset pages.
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
 * Applies a recipe default region to the controls.
 */
function applyRecipeRegion() {
  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;

  currentRegion = recipe.defaultTargetRegion;
  saveStoredRegion(currentRegion);
  renderRegionControls();
  renderPreview();
}

/**
 * Mirrors the current region state into numeric inputs.
 */
function renderRegionControls() {
  regionInputs.x.value = String(currentRegion.x);
  regionInputs.y.value = String(currentRegion.y);
  regionInputs.width.value = String(currentRegion.width);
  regionInputs.height.value = String(currentRegion.height);
}

/**
 * Renders the base image and selected crop rectangle.
 */
function renderPreview() {
  preview.replaceChildren();

  if (!baseImage) {
    const empty = document.createElement("p");
    empty.className = "asset-composite-placeholder";
    empty.textContent = "기준 이미지를 선택하면 crop 영역을 확인할 수 있어요.";
    preview.append(empty);
    return;
  }

  const stage = document.createElement("div");
  stage.className = "asset-composite-stage";
  stage.style.setProperty("--asset-composite-width", "680px");

  const image = document.createElement("img");
  image.className = "asset-composite-base";
  image.src = baseImage.previewUrl;
  image.alt = "crop 기준 이미지";
  stage.append(image);

  const region = document.createElement("span");
  region.className = "asset-composite-region";
  region.style.left = `${currentRegion.x}%`;
  region.style.top = `${currentRegion.y}%`;
  region.style.width = `${currentRegion.width}%`;
  region.style.height = `${currentRegion.height}%`;
  stage.append(region);
  preview.append(stage);
}

/**
 * Downloads the selected region as a PNG crop.
 */
async function downloadCrop() {
  if (!baseImage) {
    status.textContent = "먼저 기준 이미지를 선택해야 해요.";
    return;
  }

  const recipe = recipes[recipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;
  const cropDataUrl = await createCropDataUrl(baseImage.dataUrl, readRegion());

  downloadDataUrl(cropDataUrl, `${recipe.id}-crop.png`);
  status.textContent = "선택 영역 crop 다운로드를 시작했어요.";
}

/**
 * Wires crop page controls.
 */
function init() {
  renderRegionControls();
  renderPreview();

  recipeSelect.addEventListener("change", applyRecipeRegion);
  Object.values(regionInputs).forEach((input) => {
    input.addEventListener("input", () => {
      readRegion();
      renderPreview();
    });
  });
  baseImageInput.addEventListener("change", async () => {
    const file = baseImageInput.files?.[0];
    baseImage = file ? await readImageFile(file) : null;
    renderPreview();
  });
  downloadButton.addEventListener("click", () => {
    void downloadCrop();
  });
}

init();
