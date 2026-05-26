type PartRecipeId = "eyeBlink" | "mouthShapes" | "expressionSet";
type WorkflowMode = "serverFile" | "upload" | "url";
type GenerationStrength = "ultraConservative" | "conservative" | "balanced" | "strong";
type EditScope = "narrow" | "wide";
type ModelProfile = "sdxl-inpaint" | "sdxl-general" | "sd15-inpaint" | "custom";
type CheckpointSelectValue = "__custom__";

type GeneratedImage = {
  fileName: string;
  previewUrl: string;
};

type TargetRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "percent";
};

type CroppedBaseImage = {
  dataUrl: string;
  width: number;
  height: number;
  sourceRegionPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  targetRegionPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type MaskImage = {
  dataUrl: string;
  width: number;
  height: number;
  featherRatio: number;
};

type SaveAssetsResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  saved?: Array<{
    fileName: string;
    path: string;
  }>;
};

type GenerationResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  generation?: {
    images?: Array<{
      fileName: string;
      dataUrl: string;
    }>;
    uploadedImage?: {
      name?: string;
      filename?: string;
    };
    croppedBaseImage?: CroppedBaseImage | null;
  };
};

type ComfyModelsResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  models?: {
    checkpoints?: string[];
  };
};

type PartRecipe = {
  id: PartRecipeId;
  label: string;
  maskTarget: string;
  prompt: string;
  negativePrompt: string;
  outputNames: string[];
  outputPrompts: Record<string, string>;
  defaultTargetRegion: TargetRegion;
};

const recipes: Record<PartRecipeId, PartRecipe> = {
  eyeBlink: {
    id: "eyeBlink",
    label: "눈 깜빡임: 감은 눈",
    maskTarget: "눈 주변만 바꾸고, 머리카락과 얼굴 윤곽과 조명은 유지합니다.",
    prompt: "anime closed eyes, relaxed eyelids, natural anime blink, same character, same face",
    negativePrompt: "open eyes, half-open eyes, visible iris, visible pupil, extra eyelashes, full image repaint, different character, changed face shape, changed hair, changed outfit, blurry",
    outputNames: ["eye_closed"],
    outputPrompts: {
      eye_closed: "anime closed eyes, relaxed eyelids, natural anime blink, no visible iris, no visible pupil",
    },
    defaultTargetRegion: { x: 30, y: 25, width: 40, height: 18, unit: "percent" },
  },
  mouthShapes: {
    id: "mouthShapes",
    label: "입 모양: 닫힘, 작게 열림, 열림",
    maskTarget: "입 주변만 바꾸고, 턱과 볼과 코와 머리카락은 유지합니다.",
    prompt: "anime character mouth part edit, preserve the exact same character, only redraw the mouth area, keep eyes nose face outline hair outfit pose and lighting unchanged",
    negativePrompt: "full image repaint, different character, changed face, changed eyes, changed hair, changed outfit, teeth artifacts, warped jaw, blurry mouth",
    outputNames: ["mouth_closed", "mouth_small", "mouth_open"],
    outputPrompts: {
      mouth_closed: "closed mouth layer part, simple neutral anime mouth line, lips closed, minimal expression change",
      mouth_small: "small speaking mouth layer part, small oval open mouth, subtle talking shape, no teeth emphasis",
      mouth_open: "open speaking mouth layer part, clear anime open mouth shape, clean inner mouth shadow, natural talking expression",
    },
    defaultTargetRegion: { x: 38, y: 48, width: 24, height: 14, unit: "percent" },
  },
  expressionSet: {
    id: "expressionSet",
    label: "표정 세트: 기쁨, 생각, 놀람",
    maskTarget: "필요한 얼굴 영역만 최소로 바꾸고, 포즈와 실루엣은 유지합니다.",
    prompt: "anime character facial expression part edit, preserve the exact same character identity, same pose, same outfit, same hairstyle, same camera angle, clean matching line art",
    negativePrompt: "full image repaint, different pose, different character, changed costume, changed hairstyle, changed body, blurry, deformed face",
    outputNames: ["expression_happy", "expression_thinking", "expression_surprised"],
    outputPrompts: {
      expression_happy: "happy expression variant, gentle smile, friendly eyes, subtle cheek lift, keep silhouette unchanged",
      expression_thinking: "thinking expression variant, slightly serious eyes, small thoughtful mouth, subtle contemplative mood",
      expression_surprised: "surprised expression variant, widened eyes, small open mouth, cute anime surprise, preserve character design",
    },
    defaultTargetRegion: { x: 26, y: 22, width: 48, height: 42, unit: "percent" },
  },
};

let baseImage: GeneratedImage | null = null;
let referenceImage: GeneratedImage | null = null;
let lastCroppedBaseImage: CroppedBaseImage | null = null;
let selectedCompositeIndex = 0;
let availableCheckpoints: string[] = [];
const generatedImages: GeneratedImage[] = [];
const customCheckpointValue: CheckpointSelectValue = "__custom__";
const targetRegionStorageKey = "ghost-nest.asset-generator.target-region.v1";

const characterIdInput = document.querySelector<HTMLInputElement>("#characterIdInput");
const basePathInput = document.querySelector<HTMLInputElement>("#basePathInput");
const outputPrefixInput = document.querySelector<HTMLInputElement>("#outputPrefixInput");
const saveDirectoryInput = document.querySelector<HTMLInputElement>("#saveDirectoryInput");
const targetRegionXInput = document.querySelector<HTMLInputElement>("#targetRegionXInput");
const targetRegionYInput = document.querySelector<HTMLInputElement>("#targetRegionYInput");
const targetRegionWidthInput = document.querySelector<HTMLInputElement>("#targetRegionWidthInput");
const targetRegionHeightInput = document.querySelector<HTMLInputElement>("#targetRegionHeightInput");
const partRecipeSelect = document.querySelector<HTMLSelectElement>("#partRecipeSelect");
const generationStrengthSelect = document.querySelector<HTMLSelectElement>("#generationStrengthSelect");
const editScopeSelect = document.querySelector<HTMLSelectElement>("#editScopeSelect");
const modelProfileSelect = document.querySelector<HTMLSelectElement>("#modelProfileSelect");
const checkpointSelect = document.querySelector<HTMLSelectElement>("#checkpointSelect");
const checkpointNameInput = document.querySelector<HTMLInputElement>("#checkpointNameInput");
const checkpointCustomField = document.querySelector<HTMLElement>("#checkpointCustomField");
const checkpointStatusText = document.querySelector<HTMLElement>("#checkpointStatusText");
const closedEyeCorrectionInput = document.querySelector<HTMLInputElement>("#closedEyeCorrectionInput");
const promptInput = document.querySelector<HTMLTextAreaElement>("#promptInput");
const negativePromptInput = document.querySelector<HTMLTextAreaElement>("#negativePromptInput");
const workflowModeSelect = document.querySelector<HTMLSelectElement>("#workflowModeSelect");
const workflowFileInput = document.querySelector<HTMLInputElement>("#workflowFileInput");
const workflowUrlInput = document.querySelector<HTMLInputElement>("#workflowUrlInput");
const workflowUploadField = document.querySelector<HTMLElement>("#workflowUploadField");
const workflowUrlField = document.querySelector<HTMLElement>("#workflowUrlField");
const baseImageInput = document.querySelector<HTMLInputElement>("#baseImageInput");
const referenceImageInput = document.querySelector<HTMLInputElement>("#referenceImageInput");
const referenceImageStatusText = document.querySelector<HTMLElement>("#referenceImageStatusText");
const generatedImagesInput = document.querySelector<HTMLInputElement>("#generatedImagesInput");
const previewSizeInput = document.querySelector<HTMLInputElement>("#previewSizeInput");
const compositeFrameSelect = document.querySelector<HTMLSelectElement>("#compositeFrameSelect");
const previewGrid = document.querySelector<HTMLElement>("#assetPreviewGrid");
const compositePreview = document.querySelector<HTMLElement>("#assetCompositePreview");
const recipeOutput = document.querySelector<HTMLElement>("#recipeOutput");
const manifestOutput = document.querySelector<HTMLElement>("#manifestOutput");
const layerSnippetOutput = document.querySelector<HTMLElement>("#layerSnippetOutput");
const generationStatus = document.querySelector<HTMLElement>("#generationStatus");
const generateButton = document.querySelector<HTMLButtonElement>("#generateButton");
const downloadPartCropButton = document.querySelector<HTMLButtonElement>("#downloadPartCropButton");
const downloadAllButton = document.querySelector<HTMLButtonElement>("#downloadAllButton");
const saveAssetsButton = document.querySelector<HTMLButtonElement>("#saveAssetsButton");
const copyRecipeButton = document.querySelector<HTMLButtonElement>("#copyRecipeButton");
const copyManifestButton = document.querySelector<HTMLButtonElement>("#copyManifestButton");
const copyLayerSnippetButton = document.querySelector<HTMLButtonElement>("#copyLayerSnippetButton");

/**
 * Reads a required page element and fails early when the generator markup changes.
 */
function requireElement<TElement extends Element>(
  element: TElement | null,
  selector: string,
): TElement {
  if (!element) {
    throw new Error(`[GhostNest Layer Part Generator] Missing element: ${selector}`);
  }

  return element;
}

const elements = {
  characterIdInput: requireElement(characterIdInput, "#characterIdInput"),
  basePathInput: requireElement(basePathInput, "#basePathInput"),
  outputPrefixInput: requireElement(outputPrefixInput, "#outputPrefixInput"),
  saveDirectoryInput: requireElement(saveDirectoryInput, "#saveDirectoryInput"),
  targetRegionXInput: requireElement(targetRegionXInput, "#targetRegionXInput"),
  targetRegionYInput: requireElement(targetRegionYInput, "#targetRegionYInput"),
  targetRegionWidthInput: requireElement(targetRegionWidthInput, "#targetRegionWidthInput"),
  targetRegionHeightInput: requireElement(targetRegionHeightInput, "#targetRegionHeightInput"),
  partRecipeSelect: requireElement(partRecipeSelect, "#partRecipeSelect"),
  generationStrengthSelect: requireElement(generationStrengthSelect, "#generationStrengthSelect"),
  editScopeSelect: requireElement(editScopeSelect, "#editScopeSelect"),
  modelProfileSelect: requireElement(modelProfileSelect, "#modelProfileSelect"),
  checkpointSelect: requireElement(checkpointSelect, "#checkpointSelect"),
  checkpointNameInput: requireElement(checkpointNameInput, "#checkpointNameInput"),
  checkpointCustomField: requireElement(checkpointCustomField, "#checkpointCustomField"),
  checkpointStatusText: requireElement(checkpointStatusText, "#checkpointStatusText"),
  closedEyeCorrectionInput: requireElement(closedEyeCorrectionInput, "#closedEyeCorrectionInput"),
  promptInput: requireElement(promptInput, "#promptInput"),
  negativePromptInput: requireElement(negativePromptInput, "#negativePromptInput"),
  workflowModeSelect: requireElement(workflowModeSelect, "#workflowModeSelect"),
  workflowFileInput: requireElement(workflowFileInput, "#workflowFileInput"),
  workflowUrlInput: requireElement(workflowUrlInput, "#workflowUrlInput"),
  workflowUploadField: requireElement(workflowUploadField, "#workflowUploadField"),
  workflowUrlField: requireElement(workflowUrlField, "#workflowUrlField"),
  baseImageInput: requireElement(baseImageInput, "#baseImageInput"),
  referenceImageInput: requireElement(referenceImageInput, "#referenceImageInput"),
  referenceImageStatusText: requireElement(referenceImageStatusText, "#referenceImageStatusText"),
  generatedImagesInput: requireElement(generatedImagesInput, "#generatedImagesInput"),
  previewSizeInput: requireElement(previewSizeInput, "#previewSizeInput"),
  compositeFrameSelect: requireElement(compositeFrameSelect, "#compositeFrameSelect"),
  previewGrid: requireElement(previewGrid, "#assetPreviewGrid"),
  compositePreview: requireElement(compositePreview, "#assetCompositePreview"),
  recipeOutput: requireElement(recipeOutput, "#recipeOutput"),
  manifestOutput: requireElement(manifestOutput, "#manifestOutput"),
  layerSnippetOutput: requireElement(layerSnippetOutput, "#layerSnippetOutput"),
  generationStatus: requireElement(generationStatus, "#generationStatus"),
  generateButton: requireElement(generateButton, "#generateButton"),
  downloadPartCropButton: requireElement(downloadPartCropButton, "#downloadPartCropButton"),
  downloadAllButton: requireElement(downloadAllButton, "#downloadAllButton"),
  saveAssetsButton: requireElement(saveAssetsButton, "#saveAssetsButton"),
  copyRecipeButton: requireElement(copyRecipeButton, "#copyRecipeButton"),
  copyManifestButton: requireElement(copyManifestButton, "#copyManifestButton"),
  copyLayerSnippetButton: requireElement(copyLayerSnippetButton, "#copyLayerSnippetButton"),
};

/**
 * Returns the selected generator recipe.
 */
function getSelectedRecipe() {
  return recipes[elements.partRecipeSelect.value as PartRecipeId] ?? recipes.eyeBlink;
}

/**
 * Returns the selected workflow source mode.
 */
function getWorkflowMode() {
  return elements.workflowModeSelect.value as WorkflowMode;
}

/**
 * Returns the selected inpaint strength preset.
 */
function getGenerationStrength() {
  return elements.generationStrengthSelect.value as GenerationStrength;
}

/**
 * Returns whether the edit should be treated as a small part or broad body/pose change.
 */
function getEditScope() {
  return elements.editScopeSelect.value as EditScope;
}

/**
 * Returns the model family used to choose a matching ComfyUI workflow.
 */
function getModelProfile() {
  return elements.modelProfileSelect.value as ModelProfile;
}

/**
 * Returns whether the selected workflow source can receive the reference image.
 */
function supportsReferenceImageWorkflow() {
  return getWorkflowMode() !== "serverFile";
}

/**
 * Describes how the current workflow source will treat the optional reference image.
 */
function getReferenceImageStatusText() {
  if (supportsReferenceImageWorkflow()) {
    return referenceImage
      ? "참고 이미지를 생성 요청에 함께 전달해요. 단, workflow 안에 {{reference_image}} LoadImage 노드가 있어야 실제로 반영돼요."
      : "선택 사항이에요. 업로드/URL workflow가 {{reference_image}}를 받을 때만 실제로 사용돼요.";
  }

  return referenceImage
    ? "현재 기본 제공 workflow는 참고 이미지를 사용하지 않아서 생성 요청에는 보내지 않아요. 프롬프트와 마스크만 사용합니다."
    : "기본 제공 workflow에서는 아직 참고 이미지를 사용하지 않아요. 프롬프트와 마스크만 사용합니다.";
}

/**
 * Selects a sensible checkpoint from the ComfyUI checkpoint list for the active profile.
 */
function getPreferredCheckpointName(checkpoints = availableCheckpoints, modelProfile = getModelProfile()) {
  if (checkpoints.length === 0) {
    return "";
  }

  const lowerEntries = checkpoints.map((checkpoint) => ({
    checkpoint,
    lower: checkpoint.toLowerCase(),
  }));

  if (modelProfile === "sdxl-inpaint") {
    return lowerEntries.find((entry) => entry.lower.includes("inpaint") && entry.lower.includes("xl"))?.checkpoint
      ?? lowerEntries.find((entry) => entry.lower.includes("inpaint"))?.checkpoint
      ?? checkpoints[0];
  }

  if (modelProfile === "sd15-inpaint") {
    return lowerEntries.find((entry) => entry.lower.includes("inpaint") && !entry.lower.includes("xl"))?.checkpoint
      ?? lowerEntries.find((entry) => entry.lower.includes("inpaint"))?.checkpoint
      ?? checkpoints[0];
  }

  if (modelProfile === "sdxl-general") {
    return lowerEntries.find((entry) => entry.lower.includes("animagine"))?.checkpoint
      ?? lowerEntries.find((entry) => entry.lower.includes("xl"))?.checkpoint
      ?? checkpoints[0];
  }

  return checkpoints[0];
}

/**
 * Returns the checkpoint file name selected from the user's ComfyUI models.
 */
function getCheckpointName() {
  if (elements.checkpointSelect.value === customCheckpointValue) {
    return elements.checkpointNameInput.value.trim() || getPreferredCheckpointName() || "animagine-xl-4.0-opt.safetensors";
  }

  return elements.checkpointSelect.value || getPreferredCheckpointName() || elements.checkpointNameInput.value.trim() || "animagine-xl-4.0-opt.safetensors";
}

/**
 * Shows the manual checkpoint input only when the custom option is selected.
 */
function renderCheckpointCustomField() {
  elements.checkpointCustomField.hidden = elements.checkpointSelect.value !== customCheckpointValue;
}

/**
 * Rebuilds the checkpoint select options from ComfyUI model metadata.
 */
function renderCheckpointOptions(preferredCheckpoint = getPreferredCheckpointName()) {
  const previousValue = elements.checkpointSelect.value;
  const selectedValue = availableCheckpoints.includes(previousValue)
    ? previousValue
    : preferredCheckpoint;

  elements.checkpointSelect.replaceChildren();

  availableCheckpoints.forEach((checkpoint) => {
    const option = document.createElement("option");

    option.value = checkpoint;
    option.textContent = checkpoint;
    elements.checkpointSelect.append(option);
  });

  const customOption = document.createElement("option");
  customOption.value = customCheckpointValue;
  customOption.textContent = "직접 입력";
  elements.checkpointSelect.append(customOption);

  elements.checkpointSelect.value = selectedValue || customCheckpointValue;
  renderCheckpointCustomField();
}

/**
 * Loads the ComfyUI checkpoint list through the GhostNest bridge.
 */
async function loadComfyModels() {
  try {
    const response = await fetch("/api/devtools/comfy-models");
    const result = await response.json() as ComfyModelsResponse;

    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? result.error ?? "모델 목록을 불러오지 못했어요.");
    }

    availableCheckpoints = result.models?.checkpoints ?? [];
    renderCheckpointOptions();
    elements.checkpointStatusText.textContent = availableCheckpoints.length > 0
      ? `${availableCheckpoints.length}개 checkpoint를 불러왔어요.`
      : "ComfyUI에서 checkpoint를 찾지 못했어요. 직접 입력을 사용하세요.";
  } catch (error) {
    availableCheckpoints = [];
    renderCheckpointOptions("");
    elements.checkpointSelect.value = customCheckpointValue;
    renderCheckpointCustomField();
    elements.checkpointStatusText.textContent = error instanceof Error
      ? error.message
      : "모델 목록을 불러오지 못했어요. 직접 입력을 사용하세요.";
  } finally {
    renderOutputs();
  }
}

/**
 * Returns whether blink output should receive deterministic closed-eye line correction.
 */
function shouldApplyClosedEyeCorrection() {
  return getSelectedRecipe().id === "eyeBlink" && elements.closedEyeCorrectionInput.checked;
}

/**
 * Maps the strength selector to ComfyUI KSampler settings.
 */
function getGenerationSettings() {
  const narrowSettings: Record<GenerationStrength, { denoise: number; cfg: number; steps: number }> = {
    ultraConservative: { denoise: 0.22, cfg: 4.5, steps: 18 },
    conservative: { denoise: 0.28, cfg: 4.5, steps: 18 },
    balanced: { denoise: 0.34, cfg: 5.0, steps: 20 },
    strong: { denoise: 0.56, cfg: 6.5, steps: 26 },
  };
  const wideSettings: Record<GenerationStrength, { denoise: number; cfg: number; steps: number }> = {
    ultraConservative: { denoise: 0.32, cfg: 4.5, steps: 20 },
    conservative: { denoise: 0.42, cfg: 5.0, steps: 22 },
    balanced: { denoise: 0.55, cfg: 6.0, steps: 26 },
    strong: { denoise: 0.72, cfg: 7.0, steps: 30 },
  };
  const settings = getEditScope() === "wide" ? wideSettings : narrowSettings;

  return settings[getGenerationStrength()] ?? settings.ultraConservative;
}

/**
 * Returns the editable common prompt, falling back to the selected recipe default.
 */
function getPromptText(recipe = getSelectedRecipe()) {
  return elements.promptInput.value.trim() || recipe.prompt;
}

/**
 * Returns the editable negative prompt, falling back to the selected recipe default.
 */
function getNegativePromptText(recipe = getSelectedRecipe()) {
  return elements.negativePromptInput.value.trim() || recipe.negativePrompt;
}

/**
 * Keeps region values inside the percentage coordinate space.
 */
function clampPercent(value: number, fallback: number, min = 0) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(min, value));
}

/**
 * Keeps a numeric value inside the provided range.
 */
function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

/**
 * Returns the current target region selected for crop/layer generation.
 */
function getTargetRegion(): TargetRegion {
  const defaults = getSelectedRecipe().defaultTargetRegion;

  return {
    x: clampPercent(Number(elements.targetRegionXInput.value), defaults.x),
    y: clampPercent(Number(elements.targetRegionYInput.value), defaults.y),
    width: clampPercent(Number(elements.targetRegionWidthInput.value), defaults.width, 1),
    height: clampPercent(Number(elements.targetRegionHeightInput.value), defaults.height, 1),
    unit: "percent",
  };
}

/**
 * Applies recipe-specific region presets when the target part changes.
 */
function applyTargetRegionPreset(recipe = getSelectedRecipe()) {
  elements.targetRegionXInput.value = String(recipe.defaultTargetRegion.x);
  elements.targetRegionYInput.value = String(recipe.defaultTargetRegion.y);
  elements.targetRegionWidthInput.value = String(recipe.defaultTargetRegion.width);
  elements.targetRegionHeightInput.value = String(recipe.defaultTargetRegion.height);
}

/**
 * Reads all saved target regions from browser storage.
 */
function readSavedTargetRegions() {
  try {
    const savedRegions = JSON.parse(localStorage.getItem(targetRegionStorageKey) ?? "{}");

    return savedRegions && typeof savedRegions === "object"
      ? savedRegions as Partial<Record<PartRecipeId, TargetRegion>>
      : {};
  } catch {
    return {};
  }
}

/**
 * Saves the current target region for the selected recipe.
 */
function saveTargetRegion() {
  try {
    const recipe = getSelectedRecipe();
    const savedRegions = readSavedTargetRegions();

    savedRegions[recipe.id] = getTargetRegion();
    localStorage.setItem(targetRegionStorageKey, JSON.stringify(savedRegions));
  } catch {
    // Storage can fail in restricted browser modes; generation should still work.
  }
}

/**
 * Applies the saved target region for the recipe when one exists.
 */
function applySavedTargetRegion(recipe = getSelectedRecipe()) {
  const savedRegion = readSavedTargetRegions()[recipe.id];

  if (!savedRegion) {
    applyTargetRegionPreset(recipe);
    return;
  }

  elements.targetRegionXInput.value = String(savedRegion.x);
  elements.targetRegionYInput.value = String(savedRegion.y);
  elements.targetRegionWidthInput.value = String(savedRegion.width);
  elements.targetRegionHeightInput.value = String(savedRegion.height);
}

/**
 * Applies recipe-specific prompt defaults to the editable prompt fields.
 */
function applyPromptPreset(recipe = getSelectedRecipe()) {
  elements.promptInput.value = recipe.prompt;
  elements.negativePromptInput.value = recipe.negativePrompt;
}

/**
 * Joins the configured asset base path and file name.
 */
function resolveAssetPath(fileName: string) {
  const basePath = elements.basePathInput.value.trim();

  if (!basePath) {
    return fileName;
  }

  return `${basePath.replace(/\/?$/, "/")}${fileName}`;
}

/**
 * Builds a stable output file name for a generated variant.
 */
function getOutputFileName(outputName: string) {
  const prefix = elements.outputPrefixInput.value.trim() || elements.characterIdInput.value.trim() || "character";

  return `${prefix}_${outputName}.png`;
}

/**
 * Builds the manual-edit crop file name for the first output slot.
 */
function getManualCropFileName() {
  const recipe = getSelectedRecipe();
  const outputName = recipe.outputNames[0] ?? recipe.id;
  const prefix = elements.outputPrefixInput.value.trim() || elements.characterIdInput.value.trim() || "character";

  return `${prefix}_${outputName}_edit-crop.png`;
}

/**
 * Returns the imported result file for an output slot, falling back to the suggested file name.
 */
function getGeneratedFileName(outputName: string, index: number) {
  return generatedImages[index]?.fileName ?? getOutputFileName(outputName);
}

/**
 * Returns the output-specific prompt used by ComfyUI generation.
 */
function getOutputPrompt(outputName: string) {
  return getSelectedRecipe().outputPrompts[outputName] ?? outputName.replaceAll("_", " ");
}

/**
 * Creates the Krita inpaint recipe text for the selected part.
 */
function createRecipeText() {
  const recipe = getSelectedRecipe();
  const workflowMode = getWorkflowMode();
  const targetRegion = getTargetRegion();
  const promptText = getPromptText(recipe);
  const negativePromptText = getNegativePromptText(recipe);
  const generationSettings = getGenerationSettings();

  return [
    `레시피: ${recipe.label}`,
    `기준 이미지: ${baseImage?.fileName ?? "먼저 기준 이미지를 선택하세요."}`,
    `참고 이미지: ${referenceImage?.fileName ?? "선택 사항입니다."}`,
    `참고 이미지 처리: ${getReferenceImageStatusText()}`,
    `Workflow 모드: ${workflowMode}`,
    `편집 범위: ${getEditScope()}`,
    `모델 프로필: ${getModelProfile()}`,
    `체크포인트: ${getCheckpointName()}`,
    `변경 강도: ${getGenerationStrength()} (denoise ${generationSettings.denoise}, cfg ${generationSettings.cfg}, steps ${generationSettings.steps})`,
    `파츠 영역: x ${targetRegion.x}%, y ${targetRegion.y}%, w ${targetRegion.width}%, h ${targetRegion.height}%`,
    "",
    "작업 흐름:",
    "1. 기준 이미지를 선택합니다.",
    `2. ${recipe.maskTarget}`,
    "3. 선택한 파츠 영역만 crop PNG로 만든 뒤 ComfyUI에 요청합니다.",
    "4. ComfyUI 결과 crop을 기존 눈/입을 덮는 overlay PNG로 만들고, 가장자리만 부드럽게 투명 처리합니다.",
    "5. 결과를 확인한 뒤 다운로드하거나 프로젝트에 저장합니다.",
    "",
    `Prompt: ${promptText}`,
    `참고 이미지: ${getReferenceImageStatusText()}`,
    `Negative prompt: ${negativePromptText}`,
    "",
    "예상 결과 파일:",
    ...recipe.outputNames.map((outputName) => `- ${getOutputFileName(outputName)}: ${getOutputPrompt(outputName)}`),
  ].join("\n");
}

/**
 * Creates a CharacterAssets-shaped draft for the selected recipe.
 */
function createManifestAssetsPreview() {
  const recipe = getSelectedRecipe();
  const characterId = elements.characterIdInput.value.trim() || "character";
  const baseFileName = baseImage?.fileName ?? getOutputFileName("base");
  const baseImagePath = resolveAssetPath(baseFileName);
  const targetRegion = getTargetRegion();
  const outputPaths = recipe.outputNames.map((outputName, index) =>
    resolveAssetPath(getGeneratedFileName(outputName, index)),
  );

  if (recipe.id === "mouthShapes") {
    const [mouthClosed, mouthSmall, mouthOpen] = outputPaths;

    return {
      characterId,
      assets: {
        alt: `${characterId} character`,
        expressions: {
          neutral: baseImagePath,
          happy: baseImagePath,
          thinking: baseImagePath,
          surprised: baseImagePath,
        },
        surfaces: {
          "0": {
            id: "0",
            image: baseImagePath,
            expression: "neutral",
            layers: {
              base: { image: baseImagePath },
              mouth: {
                frames: [mouthClosed, mouthSmall, mouthOpen, mouthSmall],
                intervalMs: 140,
                coversBase: true,
                placement: targetRegion,
              },
            },
            mouthImages: {
              closed: mouthClosed,
              open: mouthOpen,
            },
          },
        },
      },
    };
  }

  if (recipe.id === "expressionSet") {
    const [happy, thinking, surprised] = outputPaths;

    return {
      characterId,
      assets: {
        alt: `${characterId} character`,
        expressions: {
          neutral: baseImagePath,
          happy,
          thinking,
          surprised,
        },
      },
    };
  }

  const [eyeClosed] = outputPaths;

  return {
    characterId,
    assets: {
      alt: `${characterId} character`,
      expressions: {
        neutral: baseImagePath,
        happy: baseImagePath,
        thinking: baseImagePath,
        surprised: baseImagePath,
      },
      surfaces: {
        "0": {
          id: "0",
          image: baseImagePath,
          expression: "neutral",
          layers: {
            base: { image: baseImagePath },
            eyes: {
              frames: [baseImagePath, eyeClosed],
              intervalMs: 4200,
              coversBase: true,
              placement: targetRegion,
            },
          },
        },
        eye_closed: {
          id: "eye_closed",
          image: eyeClosed,
          expression: "neutral",
          placement: targetRegion,
        },
      },
    },
  };
}

/**
 * Creates a focused layer snippet that can be copied into a character surface draft.
 */
function createLayerSnippetPreview() {
  const recipe = getSelectedRecipe();
  const targetRegion = getTargetRegion();
  const outputPaths = recipe.outputNames.map((outputName, index) =>
    resolveAssetPath(getGeneratedFileName(outputName, index)),
  );

  if (recipe.id === "mouthShapes") {
    const [mouthClosed, mouthSmall, mouthOpen] = outputPaths;

    return {
      layerId: "mouth",
      layer: {
        frames: [mouthClosed, mouthSmall, mouthOpen, mouthSmall],
        intervalMs: 140,
        coversBase: true,
        placement: targetRegion,
      },
      mouthImages: {
        closed: mouthClosed,
        open: mouthOpen,
      },
    };
  }

  if (recipe.id === "expressionSet") {
    const [happy, thinking, surprised] = outputPaths;

    return {
      expressions: {
        happy,
        thinking,
        surprised,
      },
      placement: targetRegion,
      note: "표정 전체 교체용 draft입니다. 필요하면 expression asset 경로로 옮겨 사용하세요.",
    };
  }

  const [eyeClosed] = outputPaths;

  return {
    layerId: "eyes",
    layer: {
      frames: [eyeClosed],
      intervalMs: 4200,
      coversBase: true,
      placement: targetRegion,
    },
  };
}

/**
 * Renders the base image, imported results, and expected output placeholders.
 */
function renderPreview() {
  const recipe = getSelectedRecipe();
  elements.previewGrid.replaceChildren();
  elements.referenceImageStatusText.textContent = getReferenceImageStatusText();

  const cards = [
    {
      title: "기준 이미지",
      fileName: baseImage?.fileName ?? "기준 이미지 선택",
      previewUrl: baseImage?.previewUrl,
      region: getTargetRegion(),
    },
    {
      title: "참고 이미지",
      fileName: referenceImage?.fileName ?? "참고 이미지 선택 사항",
      previewUrl: referenceImage?.previewUrl,
    },
    ...recipe.outputNames.map((outputName, index) => ({
      title: outputName,
      fileName: getGeneratedFileName(outputName, index),
      previewUrl: generatedImages[index]?.previewUrl,
    })),
  ];

  cards.forEach((cardData) => {
    const card = document.createElement("article");
    card.className = "asset-preview-card";

    const title = document.createElement("strong");
    title.textContent = cardData.title;

    if (cardData.previewUrl) {
      const media = document.createElement("div");
      media.className = "asset-preview-media";
      const image = document.createElement("img");
      image.src = cardData.previewUrl;
      image.alt = `${cardData.title} preview`;
      media.append(image);

      if (cardData.region) {
        const region = document.createElement("span");
        region.className = "asset-preview-region";
        region.style.left = `${cardData.region.x}%`;
        region.style.top = `${cardData.region.y}%`;
        region.style.width = `${cardData.region.width}%`;
        region.style.height = `${cardData.region.height}%`;
        media.append(region);
      }

      card.append(title, media);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "asset-preview-placeholder";
      placeholder.textContent = cardData.fileName;
      card.append(title, placeholder);
    }

    elements.previewGrid.append(card);
  });
}

/**
 * Refreshes the composite frame selector from generated images.
 */
function renderCompositeFrameSelect() {
  elements.compositeFrameSelect.replaceChildren();

  if (generatedImages.length === 0) {
    const option = document.createElement("option");
    option.value = "0";
    option.textContent = "생성된 파츠 없음";
    elements.compositeFrameSelect.append(option);
    elements.compositeFrameSelect.disabled = true;
    selectedCompositeIndex = 0;
    return;
  }

  selectedCompositeIndex = Math.min(selectedCompositeIndex, generatedImages.length - 1);

  generatedImages.forEach((image, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = image.fileName;
    option.selected = index === selectedCompositeIndex;
    elements.compositeFrameSelect.append(option);
  });

  elements.compositeFrameSelect.disabled = false;
  elements.compositeFrameSelect.value = String(selectedCompositeIndex);
}

/**
 * Renders generated part overlays on top of the base image using the selected placement.
 */
function renderCompositePreview() {
  const region = getTargetRegion();
  const selectedImage = generatedImages[selectedCompositeIndex];
  const previewWidth = clampNumber(Number(elements.previewSizeInput.value), 560, 320, 900);
  elements.compositePreview.replaceChildren();

  if (!baseImage) {
    const placeholder = document.createElement("div");
    placeholder.className = "asset-composite-placeholder";
    placeholder.textContent = "기준 이미지를 선택하면 합성 결과를 볼 수 있어요.";
    elements.compositePreview.append(placeholder);
    return;
  }

  const stage = document.createElement("div");
  stage.className = "asset-composite-stage";
  stage.style.setProperty("--asset-composite-width", `${previewWidth}px`);

  const base = document.createElement("img");
  base.className = "asset-composite-base";
  base.src = baseImage.previewUrl;
  base.alt = "기준 이미지 합성 미리보기";
  stage.append(base);

  if (selectedImage) {
    const overlay = document.createElement("img");
    overlay.className = "asset-composite-overlay";
    overlay.src = selectedImage.previewUrl;
    overlay.alt = `${selectedImage.fileName} 합성 미리보기`;
    overlay.style.left = `${region.x}%`;
    overlay.style.top = `${region.y}%`;
    overlay.style.width = `${region.width}%`;
    overlay.style.height = `${region.height}%`;
    stage.append(overlay);
  }

  if (generatedImages.length === 0) {
    const regionBox = document.createElement("span");
    regionBox.className = "asset-composite-region";
    regionBox.style.left = `${region.x}%`;
    regionBox.style.top = `${region.y}%`;
    regionBox.style.width = `${region.width}%`;
    regionBox.style.height = `${region.height}%`;
    stage.append(regionBox);
  }

  elements.compositePreview.append(stage);
}

/**
 * Refreshes the recipe text and manifest JSON output.
 */
function renderOutputs() {
  elements.recipeOutput.textContent = createRecipeText();
  elements.manifestOutput.textContent = JSON.stringify(createManifestAssetsPreview(), null, 2);
  elements.layerSnippetOutput.textContent = JSON.stringify(createLayerSnippetPreview(), null, 2);
}

/**
 * Refreshes the full generator view.
 */
function renderGenerator() {
  renderPreview();
  renderCompositeFrameSelect();
  renderCompositePreview();
  renderOutputs();
}

/**
 * Converts a selected file to a local preview object.
 */
function createImageState(file: File): GeneratedImage {
  return {
    fileName: file.name,
    previewUrl: URL.createObjectURL(file),
  };
}

/**
 * Downloads one generated image through a temporary anchor.
 */
function downloadImage(image: GeneratedImage) {
  const link = document.createElement("a");

  link.href = image.previewUrl;
  link.download = image.fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

/**
 * Downloads an in-memory PNG data URL with the provided file name.
 */
function downloadDataUrl(dataUrl: string, fileName: string) {
  downloadImage({
    fileName,
    previewUrl: dataUrl,
  });
}

/**
 * Creates the exact target-part crop for manual editing in external tools.
 */
async function createManualPartCropDataUrl(baseImageDataUrl: string) {
  const image = await loadImageElement(baseImageDataUrl);
  const regionPixels = getTargetRegionPixels(getTargetRegion(), image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저에서 수동 편집용 crop canvas를 만들 수 없어요.");
  }

  canvas.width = regionPixels.width;
  canvas.height = regionPixels.height;
  context.drawImage(
    image,
    regionPixels.x,
    regionPixels.y,
    regionPixels.width,
    regionPixels.height,
    0,
    0,
    regionPixels.width,
    regionPixels.height,
  );

  return canvas.toDataURL("image/png");
}

/**
 * Downloads the selected part crop so it can be edited manually and re-imported.
 */
async function downloadManualPartCrop() {
  try {
    const baseImageDataUrl = await readBaseImageDataUrl();

    if (!baseImageDataUrl) {
      elements.generationStatus.textContent = "먼저 기준 이미지를 선택해야 파츠 crop을 다운로드할 수 있어요.";
      return;
    }

    downloadDataUrl(await createManualPartCropDataUrl(baseImageDataUrl), getManualCropFileName());
    elements.generationStatus.textContent = "수동 편집용 파츠 crop 다운로드를 시작했어요. 수정 후 생성 결과 가져오기에 다시 올리면 됩니다.";
  } catch (error) {
    elements.generationStatus.textContent = error instanceof Error
      ? error.message
      : "파츠 crop 다운로드에 실패했어요.";
  }
}

/**
 * Downloads every generated result currently shown in the preview.
 */
function downloadGeneratedImages() {
  if (generatedImages.length === 0) {
    elements.generationStatus.textContent = "다운로드할 생성 이미지가 없어요.";
    return;
  }

  generatedImages.forEach(downloadImage);
  elements.generationStatus.textContent = `${generatedImages.length}개 이미지 다운로드를 시작했어요.`;
}

/**
 * Saves generated assets into the configured project-relative directory.
 */
async function saveGeneratedAssets() {
  if (generatedImages.length === 0) {
    elements.generationStatus.textContent = "저장할 생성 이미지가 없어요.";
    return;
  }

  elements.saveAssetsButton.disabled = true;
  elements.generationStatus.textContent = "생성 이미지를 프로젝트에 저장하는 중...";

  try {
    const response = await fetch("/api/devtools/save-generated-assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        directory: elements.saveDirectoryInput.value.trim(),
        snippetFileName: "asset-generator-layer-snippet.json",
        snippet: createLayerSnippetPreview(),
        images: generatedImages.map((image) => ({
          fileName: image.fileName,
          dataUrl: image.previewUrl,
        })),
      }),
    });
    const responseText = await response.text();
    let result: SaveAssetsResponse;

    try {
      result = responseText ? JSON.parse(responseText) as SaveAssetsResponse : {};
    } catch {
      elements.generationStatus.textContent = `저장 응답이 JSON이 아니에요: ${responseText}`;
      return;
    }

    if (!response.ok || !result.ok) {
      elements.generationStatus.textContent = result.message ?? `저장 실패: ${result.error ?? response.status}`;
      return;
    }

    elements.generationStatus.textContent = `${result.saved?.length ?? 0}개 이미지를 ${elements.saveDirectoryInput.value.trim()}에 저장했어요.`;
  } catch (error) {
    elements.generationStatus.textContent = error instanceof Error
      ? error.message
      : "저장 요청에 실패했어요.";
  } finally {
    elements.saveAssetsButton.disabled = false;
  }
}

/**
 * Reads the current base image as a data URL for bridge requests.
 */
function readBaseImageDataUrl() {
  const file = elements.baseImageInput.files?.[0];

  if (!file) {
    return Promise.resolve(null);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Base image could not be read as a data URL."));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read base image."));
    });
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image element so canvas can crop the selected part region.
 */
function loadImageElement(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => {
      resolve(image);
    });
    image.addEventListener("error", () => {
      reject(new Error("기준 이미지를 crop 처리할 수 없어요."));
    });
    image.src = dataUrl;
  });
}

/**
 * Converts a generated context crop into a target-region overlay PNG with feathered edges.
 */
async function createOverlayPartImageDataUrl(
  generatedDataUrl: string,
  targetRegionPixels: CroppedBaseImage["targetRegionPixels"],
) {
  const generatedImage = await loadImageElement(generatedDataUrl);
  const width = targetRegionPixels.width;
  const height = targetRegionPixels.height;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const featherSize = Math.max(1, Math.round(Math.min(width, height) * 0.04));

  if (!context) {
    throw new Error("브라우저에서 overlay 파츠 canvas를 만들 수 없어요.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(
    generatedImage,
    targetRegionPixels.x,
    targetRegionPixels.y,
    targetRegionPixels.width,
    targetRegionPixels.height,
    0,
    0,
    width,
    height,
  );

  const imageData = context.getImageData(0, 0, width, height);

  for (let pixelIndex = 0; pixelIndex < imageData.data.length; pixelIndex += 4) {
    const pixelNumber = pixelIndex / 4;
    const x = pixelNumber % width;
    const y = Math.floor(pixelNumber / width);
    const distanceToEdge = Math.min(x, y, width - x - 1, height - y - 1);
    const edgeAlphaScale = Math.max(0, Math.min(1, distanceToEdge / featherSize));
    const currentAlpha = imageData.data[pixelIndex + 3] ?? 0;

    imageData.data[pixelIndex + 3] = Math.round(currentAlpha * edgeAlphaScale);
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

/**
 * Estimates a soft skin-tone patch color from a generated eye-area overlay.
 */
function getAveragePatchColor(imageData: ImageData) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const alpha = imageData.data[index + 3] ?? 0;

    if (alpha < 80) {
      continue;
    }

    red += imageData.data[index] ?? 0;
    green += imageData.data[index + 1] ?? 0;
    blue += imageData.data[index + 2] ?? 0;
    count += 1;
  }

  if (count === 0) {
    return "rgba(244, 196, 169, 0.82)";
  }

  return `rgba(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)}, 0.62)`;
}

/**
 * Draws simple closed-eye patches over a blink overlay when AI inpaint keeps open eyes.
 */
async function applyClosedEyeCorrection(imageDataUrl: string) {
  const image = await loadImageElement(imageDataUrl);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저에서 감은 눈 보정 canvas를 만들 수 없어요.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const patchColor = getAveragePatchColor(context.getImageData(0, 0, width, height));
  const eyeCenters = [0.32, 0.68];
  const patchWidth = width * 0.24;
  const patchHeight = height * 0.18;
  const centerY = height * 0.47;

  eyeCenters.forEach((centerRatio) => {
    const centerX = width * centerRatio;

    context.save();
    context.filter = `blur(${Math.max(1, Math.round(Math.min(width, height) * 0.018))}px)`;
    context.beginPath();
    context.ellipse(centerX, centerY, patchWidth / 2, patchHeight / 2, -0.04, 0, Math.PI * 2);
    context.fillStyle = patchColor;
    context.fill();
    context.restore();

    context.beginPath();
    context.moveTo(centerX - patchWidth * 0.34, centerY - patchHeight * 0.03);
    context.quadraticCurveTo(centerX, centerY + patchHeight * 0.18, centerX + patchWidth * 0.34, centerY - patchHeight * 0.03);
    context.strokeStyle = "rgba(56, 34, 28, 0.92)";
    context.lineWidth = Math.max(1.4, Math.min(3, Math.min(width, height) * 0.018));
    context.lineCap = "round";
    context.stroke();
  });

  return canvas.toDataURL("image/png");
}

/**
 * Converts all generated crop images into overlay layer-part PNG previews.
 */
async function createTransparentPartImages(images: Array<{ fileName: string; dataUrl: string }>) {
  const croppedBaseImage = lastCroppedBaseImage;

  if (!croppedBaseImage) {
    return images.map((image) => ({
      fileName: image.fileName,
      previewUrl: image.dataUrl,
    }));
  }

  return Promise.all(images.map(async (image) => {
    const previewUrl = await createOverlayPartImageDataUrl(image.dataUrl, croppedBaseImage.targetRegionPixels);

    return {
      fileName: image.fileName,
      previewUrl: shouldApplyClosedEyeCorrection()
        ? await applyClosedEyeCorrection(previewUrl)
        : previewUrl,
    };
  }));
}

/**
 * Converts percentage coordinates into bounded source-image pixels.
 */
function getTargetRegionPixels(region: TargetRegion, imageWidth: number, imageHeight: number) {
  const x = Math.round((region.x / 100) * imageWidth);
  const y = Math.round((region.y / 100) * imageHeight);
  const width = Math.round((region.width / 100) * imageWidth);
  const height = Math.round((region.height / 100) * imageHeight);
  const boundedX = Math.min(Math.max(0, x), Math.max(0, imageWidth - 1));
  const boundedY = Math.min(Math.max(0, y), Math.max(0, imageHeight - 1));

  return {
    x: boundedX,
    y: boundedY,
    width: Math.max(1, Math.min(width, imageWidth - boundedX)),
    height: Math.max(1, Math.min(height, imageHeight - boundedY)),
  };
}

/**
 * Expands the selected target region so the model receives enough surrounding face context.
 */
function getContextRegionPixels(
  targetRegionPixels: CroppedBaseImage["sourceRegionPixels"],
  imageWidth: number,
  imageHeight: number,
  recipe = getSelectedRecipe(),
) {
  const centerX = targetRegionPixels.x + targetRegionPixels.width / 2;
  const centerY = targetRegionPixels.y + targetRegionPixels.height / 2;
  const isNarrowEdit = getEditScope() === "narrow";
  const widthScale = recipe.id === "eyeBlink" || isNarrowEdit ? 1.8 : 3.2;
  const heightScale = recipe.id === "eyeBlink" || isNarrowEdit ? 2.4 : 4.8;
  const crossWidthScale = recipe.id === "eyeBlink" || isNarrowEdit ? 2.4 : 4.8;
  const crossHeightScale = recipe.id === "eyeBlink" || isNarrowEdit ? 1.2 : 2.2;
  const contextWidth = Math.min(imageWidth, Math.max(targetRegionPixels.width * widthScale, targetRegionPixels.height * crossWidthScale));
  const contextHeight = Math.min(imageHeight, Math.max(targetRegionPixels.height * heightScale, targetRegionPixels.width * crossHeightScale));
  const x = Math.round(Math.min(Math.max(0, centerX - contextWidth / 2), Math.max(0, imageWidth - contextWidth)));
  const y = Math.round(Math.min(Math.max(0, centerY - contextHeight / 2), Math.max(0, imageHeight - contextHeight)));

  return {
    x,
    y,
    width: Math.max(1, Math.round(contextWidth)),
    height: Math.max(1, Math.round(contextHeight)),
  };
}

/**
 * Rounds image dimensions to a VAE-friendly multiple.
 */
function roundToImageMultiple(value: number) {
  return Math.max(8, Math.round(value / 8) * 8);
}

/**
 * Calculates a conservative upscale ratio for small context crops.
 */
function getContextScale(sourceRegionPixels: CroppedBaseImage["sourceRegionPixels"]) {
  const longestSide = Math.max(sourceRegionPixels.width, sourceRegionPixels.height);

  return Math.min(2, Math.max(1, 768 / longestSide));
}

/**
 * Creates the context crop image that ComfyUI should edit for layer-part generation.
 */
async function createCroppedBaseImageData(baseImageDataUrl: string, region: TargetRegion): Promise<CroppedBaseImage> {
  const image = await loadImageElement(baseImageDataUrl);
  const targetSourceRegionPixels = getTargetRegionPixels(region, image.naturalWidth, image.naturalHeight);
  const sourceRegionPixels = getContextRegionPixels(targetSourceRegionPixels, image.naturalWidth, image.naturalHeight);
  const contextScale = getContextScale(sourceRegionPixels);
  const scaledWidth = roundToImageMultiple(sourceRegionPixels.width * contextScale);
  const scaledHeight = roundToImageMultiple(sourceRegionPixels.height * contextScale);
  const scaleX = scaledWidth / sourceRegionPixels.width;
  const scaleY = scaledHeight / sourceRegionPixels.height;
  const targetRegionPixels = {
    x: Math.round((targetSourceRegionPixels.x - sourceRegionPixels.x) * scaleX),
    y: Math.round((targetSourceRegionPixels.y - sourceRegionPixels.y) * scaleY),
    width: Math.max(1, Math.round(targetSourceRegionPixels.width * scaleX)),
    height: Math.max(1, Math.round(targetSourceRegionPixels.height * scaleY)),
  };
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저에서 crop canvas를 만들 수 없어요.");
  }

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  context.drawImage(
    image,
    sourceRegionPixels.x,
    sourceRegionPixels.y,
    sourceRegionPixels.width,
    sourceRegionPixels.height,
    0,
    0,
    scaledWidth,
    scaledHeight,
  );

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    sourceRegionPixels,
    targetRegionPixels,
  };
}

/**
 * Creates a mask that only exposes the selected target region inside the context crop.
 */
function createMaskImageData(croppedBaseImage: CroppedBaseImage): MaskImage {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = croppedBaseImage.width;
  const height = croppedBaseImage.height;
  const target = croppedBaseImage.targetRegionPixels;
  const featherRatio = getSelectedRecipe().id === "eyeBlink" ? 0.06 : 0.12;
  const featherX = Math.max(1, Math.round(target.width * featherRatio));
  const featherY = Math.max(1, Math.round(target.height * featherRatio));

  if (!context) {
    throw new Error("브라우저에서 mask canvas를 만들 수 없어요.");
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "rgb(0, 0, 0)";
  context.fillRect(0, 0, width, height);

  const innerX = target.x + featherX;
  const innerY = target.y + featherY;
  const innerWidth = Math.max(1, target.width - featherX * 2);
  const innerHeight = Math.max(1, target.height - featherY * 2);

  context.fillStyle = "rgb(255, 255, 255)";
  context.fillRect(innerX, innerY, innerWidth, innerHeight);

  const leftGradient = context.createLinearGradient(target.x, 0, innerX, 0);
  leftGradient.addColorStop(0, "rgb(0, 0, 0)");
  leftGradient.addColorStop(1, "rgb(255, 255, 255)");
  context.fillStyle = leftGradient;
  context.fillRect(target.x, innerY, featherX, innerHeight);

  const rightGradient = context.createLinearGradient(innerX + innerWidth, 0, target.x + target.width, 0);
  rightGradient.addColorStop(0, "rgb(255, 255, 255)");
  rightGradient.addColorStop(1, "rgb(0, 0, 0)");
  context.fillStyle = rightGradient;
  context.fillRect(innerX + innerWidth, innerY, featherX, innerHeight);

  const topGradient = context.createLinearGradient(0, target.y, 0, innerY);
  topGradient.addColorStop(0, "rgb(0, 0, 0)");
  topGradient.addColorStop(1, "rgb(255, 255, 255)");
  context.fillStyle = topGradient;
  context.fillRect(innerX, target.y, innerWidth, featherY);

  const bottomGradient = context.createLinearGradient(0, innerY + innerHeight, 0, target.y + target.height);
  bottomGradient.addColorStop(0, "rgb(255, 255, 255)");
  bottomGradient.addColorStop(1, "rgb(0, 0, 0)");
  context.fillStyle = bottomGradient;
  context.fillRect(innerX, innerY + innerHeight, innerWidth, featherY);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
    featherRatio,
  };
}

/**
 * Reads the optional reference image as a data URL for bridge requests.
 */
function readReferenceImageDataUrl() {
  if (!supportsReferenceImageWorkflow()) {
    return Promise.resolve(null);
  }

  const file = elements.referenceImageInput.files?.[0];

  if (!file) {
    return Promise.resolve(null);
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Reference image could not be read as a data URL."));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read reference image."));
    });
    reader.readAsDataURL(file);
  });
}

/**
 * Reads an uploaded workflow JSON file when upload mode is selected.
 */
function readUploadedWorkflow() {
  const file = elements.workflowFileInput.files?.[0];

  if (!file) {
    return Promise.resolve(null);
  }

  return new Promise<unknown>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      try {
        resolve(JSON.parse(String(reader.result ?? "")));
      } catch (error) {
        reject(new Error("Uploaded workflow JSON could not be parsed."));
      }
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Failed to read workflow JSON."));
    });
    reader.readAsText(file);
  });
}

/**
 * Builds the workflow source payload for the bridge request.
 */
async function createWorkflowSourceRequest() {
  const mode = getWorkflowMode();

  if (mode === "upload") {
    return {
      mode,
      workflow: await readUploadedWorkflow(),
      fileName: elements.workflowFileInput.files?.[0]?.name ?? null,
      editScope: getEditScope(),
      modelProfile: getModelProfile(),
    };
  }

  if (mode === "url") {
    return {
      mode,
      url: elements.workflowUrlInput.value.trim(),
      editScope: getEditScope(),
      modelProfile: getModelProfile(),
    };
  }

  return {
    mode,
    editScope: getEditScope(),
    modelProfile: getModelProfile(),
  };
}

/**
 * Builds the same-origin generation request for the GhostNest bridge.
 */
async function createGenerationRequest() {
  const recipe = getSelectedRecipe();
  const baseImageDataUrl = await readBaseImageDataUrl();
  const targetRegion = getTargetRegion();
  const croppedBaseImage = baseImageDataUrl
    ? await createCroppedBaseImageData(baseImageDataUrl, targetRegion)
    : null;
  const maskImage = croppedBaseImage ? createMaskImageData(croppedBaseImage) : null;
  lastCroppedBaseImage = croppedBaseImage;

  if (!croppedBaseImage) {
    throw new Error("기준 이미지를 선택해야 파츠 영역 crop을 만들 수 있어요.");
  }

  return {
    recipeId: recipe.id,
    characterId: elements.characterIdInput.value.trim() || "character",
    outputPrefix: elements.outputPrefixInput.value.trim(),
    outputNames: recipe.outputNames,
    outputPrompts: recipe.outputPrompts,
    prompt: getPromptText(recipe),
    negativePrompt: getNegativePromptText(recipe),
    generationSettings: getGenerationSettings(),
    editScope: getEditScope(),
    modelProfile: getModelProfile(),
    checkpointName: getCheckpointName(),
    maskTarget: recipe.maskTarget,
    baseImageFileName: baseImage?.fileName ?? null,
    baseImageDataUrl,
    croppedBaseImageDataUrl: croppedBaseImage?.dataUrl ?? null,
    croppedBaseImage,
    maskImageDataUrl: maskImage?.dataUrl ?? null,
    maskImage,
    referenceImageFileName: referenceImage?.fileName ?? null,
    referenceImageDataUrl: await readReferenceImageDataUrl(),
    targetRegion,
    workflowSource: await createWorkflowSourceRequest(),
  };
}

/**
 * Calls the GhostNest bridge so ComfyUI stays behind the local dev server.
 */
async function generateLayerParts() {
  elements.generateButton.disabled = true;
  elements.generationStatus.textContent = "선택한 파츠 영역을 crop으로 만든 뒤 GhostNest bridge에 생성 요청을 보내는 중이에요.";

  try {
    const response = await fetch("/api/devtools/generate-layer-part", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(await createGenerationRequest()),
    });
    const responseText = await response.text();
    let result: GenerationResponse;

    try {
      result = responseText ? JSON.parse(responseText) as GenerationResponse : {};
    } catch {
      elements.generationStatus.textContent = `Bridge 응답이 JSON이 아니에요: ${responseText}`;
      return;
    }

    if (!response.ok || !result.ok) {
      elements.generationStatus.textContent = result.message ?? `생성 실패: ${result.error ?? response.status}`;
      return;
    }

    const transparentPartImages = await createTransparentPartImages(result.generation?.images ?? []);

    generatedImages.forEach(revokeImageState);
    generatedImages.splice(0, generatedImages.length, ...transparentPartImages);
    renderGenerator();
    const uploadedInputName = result.generation?.uploadedImage?.name
      ?? result.generation?.uploadedImage?.filename
      ?? "unknown";
    const cropInfo = result.generation?.croppedBaseImage
      ? `${result.generation.croppedBaseImage.width}x${result.generation.croppedBaseImage.height}`
      : "unknown";

    elements.generationStatus.textContent = `생성이 완료됐어요. 입력: ${uploadedInputName}, crop: ${cropInfo}, 결과: ${generatedImages.length}개.`;
  } catch (error) {
    elements.generationStatus.textContent = error instanceof Error
      ? error.message
      : "생성 요청에 실패했어요.";
  } finally {
    elements.generateButton.disabled = false;
  }
}

/**
 * Releases object URLs when replacing generated previews.
 */
function revokeImageState(image: GeneratedImage | null | undefined) {
  if (image) {
    URL.revokeObjectURL(image.previewUrl);
  }
}

/**
 * Copies generated text to the clipboard and temporarily changes the button label.
 */
async function copyText(text: string, button: HTMLButtonElement, idleLabel: string) {
  if (!navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(text);
  button.textContent = "복사됨";
  window.setTimeout(() => {
    button.textContent = idleLabel;
  }, 1200);
}

/**
 * Wires generator controls without coupling this devtool to runtime boot code.
 */
function bindGeneratorEvents() {
  elements.baseImageInput.addEventListener("change", () => {
    const file = elements.baseImageInput.files?.[0];

    if (!file) {
      return;
    }

    revokeImageState(baseImage);
    baseImage = createImageState(file);
    renderGenerator();
  });

  elements.referenceImageInput.addEventListener("change", () => {
    const file = elements.referenceImageInput.files?.[0];

    revokeImageState(referenceImage);
    referenceImage = file ? createImageState(file) : null;
    renderGenerator();
  });

  elements.generatedImagesInput.addEventListener("change", () => {
    generatedImages.forEach(revokeImageState);
    generatedImages.splice(0, generatedImages.length);

    Array.from(elements.generatedImagesInput.files ?? []).forEach((file) => {
      generatedImages.push(createImageState(file));
    });

    renderGenerator();
  });

  [
    elements.characterIdInput,
    elements.basePathInput,
    elements.outputPrefixInput,
    elements.saveDirectoryInput,
    elements.previewSizeInput,
    elements.generationStrengthSelect,
    elements.editScopeSelect,
    elements.modelProfileSelect,
    elements.checkpointSelect,
    elements.checkpointNameInput,
    elements.closedEyeCorrectionInput,
    elements.promptInput,
    elements.negativePromptInput,
    elements.workflowModeSelect,
    elements.workflowUrlInput,
  ].forEach((element) => {
    element.addEventListener("input", renderGenerator);
    element.addEventListener("change", renderGenerator);
  });

  [
    elements.targetRegionXInput,
    elements.targetRegionYInput,
    elements.targetRegionWidthInput,
    elements.targetRegionHeightInput,
  ].forEach((element) => {
    element.addEventListener("input", () => {
      saveTargetRegion();
      renderGenerator();
    });
    element.addEventListener("change", () => {
      saveTargetRegion();
      renderGenerator();
    });
  });

  elements.workflowModeSelect.addEventListener("change", () => {
    renderWorkflowModeFields();
  });

  elements.modelProfileSelect.addEventListener("change", () => {
    renderCheckpointOptions();
    renderGenerator();
  });

  elements.checkpointSelect.addEventListener("change", () => {
    renderCheckpointCustomField();
    renderGenerator();
  });

  elements.partRecipeSelect.addEventListener("change", () => {
    const recipe = getSelectedRecipe();

    applySavedTargetRegion(recipe);
    applyPromptPreset(recipe);
    renderGenerator();
  });

  elements.workflowFileInput.addEventListener("change", renderOutputs);

  elements.compositeFrameSelect.addEventListener("change", () => {
    selectedCompositeIndex = Number(elements.compositeFrameSelect.value);
    renderCompositePreview();
  });

  elements.copyRecipeButton.addEventListener("click", () => {
    void copyText(elements.recipeOutput.textContent ?? "", elements.copyRecipeButton, "레시피 복사");
  });

  elements.copyManifestButton.addEventListener("click", () => {
    void copyText(elements.manifestOutput.textContent ?? "", elements.copyManifestButton, "JSON 복사");
  });

  elements.copyLayerSnippetButton.addEventListener("click", () => {
    void copyText(
      elements.layerSnippetOutput.textContent ?? "",
      elements.copyLayerSnippetButton,
      "Snippet 복사",
    );
  });

  elements.generateButton.addEventListener("click", () => {
    void generateLayerParts();
  });

  elements.downloadPartCropButton.addEventListener("click", () => {
    void downloadManualPartCrop();
  });

  elements.downloadAllButton.addEventListener("click", downloadGeneratedImages);

  elements.saveAssetsButton.addEventListener("click", () => {
    void saveGeneratedAssets();
  });
}

/**
 * Shows the workflow input that matches the selected source mode.
 */
function renderWorkflowModeFields() {
  const mode = getWorkflowMode();

  elements.workflowUploadField.hidden = mode !== "upload";
  elements.workflowUrlField.hidden = mode !== "url";
}

bindGeneratorEvents();
applySavedTargetRegion();
applyPromptPreset();
renderCheckpointOptions("");
renderWorkflowModeFields();
renderGenerator();
void loadComfyModels();
