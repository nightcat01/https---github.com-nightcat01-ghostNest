export type PartRecipeId = "eyeBlink" | "mouthShapes" | "expressionSet";
export type TargetRegion = { x: number; y: number; width: number; height: number; unit: "percent" };
export type LabImage = { fileName: string; previewUrl: string; dataUrl: string };

export type PartRecipe = {
  id: PartRecipeId;
  label: string;
  outputNames: string[];
  defaultTargetRegion: TargetRegion;
  prompt: string;
  negativePrompt: string;
  outputPrompts: Record<string, string>;
};

export const targetRegionStorageKey = "ghost-nest.asset-generator.target-region.v1";
export const regionOverlayVisibleStorageKey = "ghost-nest.asset-region-overlay-visible.v1";

export const recipes: Record<PartRecipeId, PartRecipe> = {
  eyeBlink: {
    id: "eyeBlink",
    label: "눈 깜빡임: 감은 눈",
    outputNames: ["eye_closed"],
    defaultTargetRegion: { x: 30, y: 25, width: 40, height: 18, unit: "percent" },
    prompt: "anime closed eyes, relaxed eyelids, natural anime blink, same character, same face",
    negativePrompt: "open eyes, half-open eyes, visible iris, visible pupil, full image repaint, different character, blurry",
    outputPrompts: {
      eye_closed: "anime closed eyes, relaxed eyelids, natural anime blink",
    },
  },
  mouthShapes: {
    id: "mouthShapes",
    label: "입 모양: 닫힘, 작게 열림, 열림",
    outputNames: ["mouth_closed", "mouth_small", "mouth_open"],
    defaultTargetRegion: { x: 38, y: 48, width: 24, height: 14, unit: "percent" },
    prompt: "anime character mouth part edit, same character, only redraw the mouth area",
    negativePrompt: "full image repaint, different character, changed face, changed eyes, blurry mouth",
    outputPrompts: {
      mouth_closed: "closed mouth layer part, simple neutral anime mouth line",
      mouth_small: "small speaking mouth layer part, small oval open mouth",
      mouth_open: "open speaking mouth layer part, clear anime open mouth shape",
    },
  },
  expressionSet: {
    id: "expressionSet",
    label: "표정 세트: 기쁨, 생각, 놀람",
    outputNames: ["expression_happy", "expression_thinking", "expression_surprised"],
    defaultTargetRegion: { x: 26, y: 22, width: 48, height: 42, unit: "percent" },
    prompt: "anime character facial expression part edit, same character identity, same pose",
    negativePrompt: "full image repaint, different pose, different character, blurry, deformed face",
    outputPrompts: {
      expression_happy: "happy expression variant, gentle smile",
      expression_thinking: "thinking expression variant, thoughtful mouth",
      expression_surprised: "surprised expression variant, small open mouth",
    },
  },
};

/**
 * Reads a required page element and fails early when markup and script drift apart.
 */
export function requireElement<TElement extends Element>(element: TElement | null, selector: string): TElement {
  if (!element) {
    throw new Error(`[GhostNest Asset Tool] Missing element: ${selector}`);
  }

  return element;
}

/**
 * Keeps region numbers inside the normalized percent coordinate space.
 */
export function clampRegion(region: TargetRegion): TargetRegion {
  const x = clamp(region.x, 0, 99);
  const y = clamp(region.y, 0, 99);
  const width = clamp(region.width, 1, 100 - x);
  const height = clamp(region.height, 1, 100 - y);

  return { x, y, width, height, unit: "percent" };
}

/**
 * Loads the last selected region, falling back to the active recipe default.
 */
export function loadStoredRegion(fallback: TargetRegion): TargetRegion {
  try {
    const rawValue = window.localStorage.getItem(targetRegionStorageKey);
    const parsed = rawValue ? JSON.parse(rawValue) as TargetRegion : fallback;

    return clampRegion({ ...fallback, ...parsed, unit: "percent" });
  } catch {
    return fallback;
  }
}

/**
 * Saves the current target region for every asset tool page.
 */
export function saveStoredRegion(region: TargetRegion) {
  window.localStorage.setItem(targetRegionStorageKey, JSON.stringify(clampRegion(region)));
}

/**
 * Loads whether the visual placement/crop outline should be shown.
 */
export function loadRegionOverlayVisible() {
  return window.localStorage.getItem(regionOverlayVisibleStorageKey) !== "false";
}

/**
 * Saves whether the visual placement/crop outline should be shown.
 */
export function saveRegionOverlayVisible(visible: boolean) {
  window.localStorage.setItem(regionOverlayVisibleStorageKey, visible ? "true" : "false");
}

/**
 * Converts an uploaded file into a previewable data URL object.
 */
export function readImageFile(file: File): Promise<LabImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("이미지를 data URL로 읽지 못했어요."));
        return;
      }

      resolve({
        fileName: file.name,
        previewUrl: reader.result,
        dataUrl: reader.result,
      });
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("이미지를 읽지 못했어요."));
    });
    reader.readAsDataURL(file);
  });
}

/**
 * Renders the base image and selected region into a PNG crop.
 */
export async function createCropDataUrl(imageDataUrl: string, region: TargetRegion) {
  const source = await loadImage(imageDataUrl);
  const safeRegion = clampRegion(region);
  const sx = Math.round((safeRegion.x / 100) * source.naturalWidth);
  const sy = Math.round((safeRegion.y / 100) * source.naturalHeight);
  const sw = Math.max(1, Math.round((safeRegion.width / 100) * source.naturalWidth));
  const sh = Math.max(1, Math.round((safeRegion.height / 100) * source.naturalHeight));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저 canvas를 사용할 수 없어요.");
  }

  canvas.width = sw;
  canvas.height = sh;
  context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvas.toDataURL("image/png");
}

/**
 * Creates a white inpaint mask matching the given image dimensions.
 */
export async function createFullMaskDataUrl(imageDataUrl: string) {
  const source = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("브라우저 canvas를 사용할 수 없어요.");
  }

  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

/**
 * Downloads a data URL using a temporary browser anchor.
 */
export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

/**
 * Builds a project asset path from a base folder and file name.
 */
export function resolveAssetPath(basePath: string, fileName: string) {
  const normalizedBasePath = basePath.trim().replace(/\/?$/, "/");

  return `${normalizedBasePath}${fileName}`;
}

/**
 * Mirrors status text into a visible toast and marks the status tone.
 */
export function enhanceStatusNotice(status: HTMLElement) {
  let hideTimerId: number | null = null;
  let lastMessage = status.textContent?.trim() ?? "";
  const toast = document.createElement("div");

  toast.className = "asset-status-toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  document.body.append(toast);

  const showNotice = () => {
    const message = status.textContent?.trim() ?? "";

    if (!message || message === lastMessage) {
      return;
    }

    lastMessage = message;

    const tone = getStatusTone(message);

    status.dataset.tone = tone;
    toast.dataset.tone = tone;
    toast.textContent = message;
    toast.classList.add("is-visible");

    if (hideTimerId !== null) {
      window.clearTimeout(hideTimerId);
    }

    hideTimerId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      hideTimerId = null;
    }, tone === "progress" ? 1800 : 3600);
  };

  status.dataset.tone = getStatusTone(lastMessage);

  new MutationObserver(showNotice).observe(status, {
    characterData: true,
    childList: true,
    subtree: true,
  });
}

/**
 * Infers a visual tone from user-facing status copy.
 */
function getStatusTone(message: string) {
  if (/중이에요|준비|확인/.test(message)) {
    return "progress";
  }

  if (/완료|저장했|저장 완료|만들었|불러왔|복사|받았/.test(message)) {
    return "success";
  }

  if (/실패|못|먼저|입력|선택|필요|없어요|삭제할|오류|error/i.test(message)) {
    return "warning";
  }

  return "info";
}

/**
 * Loads an image element before canvas drawing.
 */
function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("이미지를 canvas에 불러오지 못했어요.")));
    image.src = dataUrl;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
