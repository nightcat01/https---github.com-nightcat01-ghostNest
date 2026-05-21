import type {
  CharacterDefinition,
  CharacterTouchArea,
  HitboxEditorDevtoolSelectors,
  StorageAdapter,
} from "../core/types.js";
import type { RuntimeElements } from "../runtime/domElements.js";

const defaultHitAreas: Record<string, CharacterTouchArea> = {
  head: { minX: 0, maxX: 1, minY: 0, maxY: 0.36 },
  face: { minX: 0.22, maxX: 0.78, minY: 0.36, maxY: 0.58 },
  body: { minX: 0, maxX: 1, minY: 0.58, maxY: 1 },
};

const defaultParts = Object.keys(defaultHitAreas);

type InitHitboxEditorOptions = {
  elements: RuntimeElements;
  character: CharacterDefinition;
  selectors: HitboxEditorDevtoolSelectors;
  storageAdapter: StorageAdapter;
};

function optionalElement<TElement extends Element>(selector: string | undefined): TElement | null {
  if (!selector) {
    return null;
  }

  return document.querySelector<TElement>(selector);
}

const hitAreasStorageKey = "hitAreas";

function isHitArea(value: unknown): value is CharacterTouchArea {
  if (!value || typeof value !== "object") {
    return false;
  }

  const area = value as Record<string, unknown>;
  return (
    typeof area.minX === "number" &&
    typeof area.maxX === "number" &&
    typeof area.minY === "number" &&
    typeof area.maxY === "number"
  );
}

function normalizeHitAreas(value: unknown) {
  const source = value && typeof value === "object" && "hitAreas" in value
    ? (value as { hitAreas?: unknown }).hitAreas
    : value;

  if (!source || typeof source !== "object") {
    return null;
  }

  const hitAreas: Record<string, CharacterTouchArea> = {};

  Object.entries(source as Record<string, unknown>).forEach(([part, area]) => {
    if (isHitArea(area)) {
      hitAreas[part] = area;
    }
  });

  return Object.keys(hitAreas).length > 0 ? hitAreas : null;
}

async function loadStoredHitAreas(storageAdapter: StorageAdapter) {
  try {
    return normalizeHitAreas(await storageAdapter.get(hitAreasStorageKey));
  } catch {
    return null;
  }
}

async function saveStoredHitAreas(
  storageAdapter: StorageAdapter,
  hitAreas: Partial<Record<string, CharacterTouchArea>>,
) {
  const serializableHitAreas: Record<string, CharacterTouchArea> = {};

  Object.entries(hitAreas).forEach(([part, area]) => {
    if (area) {
      serializableHitAreas[part] = area;
    }
  });

  await storageAdapter.set(hitAreasStorageKey, { hitAreas: serializableHitAreas });
}

function getPartColor(part: string, alpha = 0.4) {
  if (part === "head") return `rgba(255, 0, 0, ${alpha})`;
  if (part === "face") return `rgba(0, 255, 0, ${alpha})`;
  if (part === "body") return `rgba(0, 0, 255, ${alpha})`;

  let hash = 0;
  for (let i = 0; i < part.length; i += 1) {
    hash = part.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  const hex = "00000".substring(0, 6 - color.length) + color;

  return `rgba(${parseInt(hex.substring(0, 2), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${parseInt(hex.substring(4, 6), 16)}, ${alpha})`;
}

function getEditorIndicatorColor(part: string) {
  if (part === "head") return "red";
  if (part === "face") return "green";
  if (part === "body") return "blue";

  let hash = 0;
  for (let i = 0; i < part.length; i += 1) {
    hash = part.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - color.length)}${color}`;
}

function getDefaultAreaValue(part: string, axis: keyof CharacterTouchArea) {
  return defaultHitAreas[part]?.[axis] ?? (axis === "minX" ? 0.4 : axis === "maxX" ? 0.6 : axis === "minY" ? 0.4 : 0.6);
}

function ensureHitAreas(character: CharacterDefinition) {
  if (!character.assets) {
    character.assets = { expressions: { neutral: "", happy: "", thinking: "", surprised: "" }, alt: "" };
  }

  if (!character.assets.hitAreas) {
    character.assets.hitAreas = {};
  }

  return character.assets.hitAreas;
}

async function applyStoredHitAreas(character: CharacterDefinition, storageAdapter: StorageAdapter) {
  const storedHitAreas = await loadStoredHitAreas(storageAdapter);

  if (!storedHitAreas) {
    return;
  }

  character.assets!.hitAreas = {
    ...character.assets!.hitAreas,
    ...storedHitAreas,
  };
}

export function initHitboxEditor({ elements, character, selectors, storageAdapter }: InitHitboxEditorOptions) {
  const hitAreas = ensureHitAreas(character);
  const cleanupCallbacks: Array<() => void> = [];
  const editorElements = {
    editor: optionalElement<HTMLElement>(selectors.editor),
    addButton: optionalElement<HTMLButtonElement>(selectors.addButton),
    closeButton: optionalElement<HTMLElement>(selectors.closeButton),
    body: optionalElement<HTMLElement>(selectors.body),
    copyButton: optionalElement<HTMLElement>(selectors.copyButton),
  };

  const renderDebugHitAreas = () => {
    const isEditorOpen = editorElements.editor && !editorElements.editor.hidden;

    if (!isEditorOpen) {
      elements.sprite.querySelectorAll(".debug-hit-area").forEach((element) => element.remove());
      return;
    }

    elements.sprite.querySelectorAll(".debug-hit-area").forEach((element) => element.remove());
    elements.sprite.style.position = "relative";

    const mergedAreas: Record<string, CharacterTouchArea> = {
      ...defaultHitAreas,
      ...character.assets?.hitAreas,
    };

    Object.entries(mergedAreas).forEach(([part, area]) => {
      const color = getPartColor(part);
      const debugArea = document.createElement("div");
      debugArea.className = "debug-hit-area";
      debugArea.style.position = "absolute";
      debugArea.style.left = `${area.minX * 100}%`;
      debugArea.style.top = `${area.minY * 100}%`;
      debugArea.style.width = `${(area.maxX - area.minX) * 100}%`;
      debugArea.style.height = `${(area.maxY - area.minY) * 100}%`;
      debugArea.style.border = `2px solid ${color}`;
      debugArea.style.backgroundColor = getPartColor(part, 0.1);
      debugArea.style.boxSizing = "border-box";
      debugArea.style.pointerEvents = "none";
      debugArea.style.zIndex = "10";

      const label = document.createElement("span");
      label.textContent = part;
      label.style.position = "absolute";
      label.style.top = "0";
      label.style.left = "0";
      label.style.backgroundColor = color;
      label.style.color = "white";
      label.style.fontSize = "10px";
      label.style.padding = "2px 4px";

      debugArea.appendChild(label);
      elements.sprite.appendChild(debugArea);
    });
  };

  void applyStoredHitAreas(character, storageAdapter).then(() => {
    renderEditorParts();
    renderDebugHitAreas();
  });

  if (!editorElements.editor || !editorElements.body) {
    renderDebugHitAreas();
    return {
      renderDebugHitAreas,
      destroy() {
        elements.sprite.querySelectorAll(".debug-hit-area").forEach((element) => element.remove());
      },
    };
  }

  const editor = editorElements.editor;
  const header = editor.querySelector(".hitbox-editor-header") as HTMLElement | null;

  if (header) {
    header.style.cursor = "grab";

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) {
        return;
      }

      if ((e.target as HTMLElement).tagName.toLowerCase() === "button") {
        return;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = editor.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      editor.style.width = `${rect.width}px`;
      editor.style.height = `${rect.height}px`;
      editor.style.right = "auto";
      editor.style.bottom = "auto";
      editor.style.left = `${initialX}px`;
      editor.style.top = `${initialY}px`;
      editor.style.margin = "0"; // prevent margin offset issues

      editor.dataset.dragging = "true";
      header.style.cursor = "grabbing";
      header.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      editor.style.left = `${initialX + dx}px`;
      editor.style.top = `${initialY + dy}px`;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      delete editor.dataset.dragging;
      header.style.cursor = "grab";
      editor.style.removeProperty("height");
      header.releasePointerCapture?.(e.pointerId);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      delete editor.dataset.dragging;
      header.style.cursor = "grab";
      editor.style.removeProperty("height");
      header.releasePointerCapture?.(e.pointerId);
    };

    header.addEventListener("pointerdown", handlePointerDown);
    header.addEventListener("pointermove", handlePointerMove);
    header.addEventListener("pointerup", handlePointerUp);
    header.addEventListener("pointercancel", handlePointerCancel);
    cleanupCallbacks.push(() => {
      header.removeEventListener("pointerdown", handlePointerDown);
      header.removeEventListener("pointermove", handlePointerMove);
      header.removeEventListener("pointerup", handlePointerUp);
      header.removeEventListener("pointercancel", handlePointerCancel);
    });
  }

  const renderEditorParts = () => {
    editorElements.body?.replaceChildren();

    const currentParts = Object.keys(hitAreas);
    defaultParts.forEach((part) => {
      if (!currentParts.includes(part)) {
        currentParts.unshift(part);
      }
    });

    Array.from(new Set(currentParts)).forEach((part) => {
      const group = document.createElement("div");
      group.className = "hitbox-part-group";

      const title = document.createElement("h4");
      const titleLeft = document.createElement("div");
      titleLeft.className = "title-left";

      const indicator = document.createElement("span");
      indicator.className = "color-indicator";
      indicator.style.backgroundColor = getEditorIndicatorColor(part);

      titleLeft.appendChild(indicator);
      titleLeft.appendChild(document.createTextNode(` ${part}`));
      title.appendChild(titleLeft);

      if (!defaultParts.includes(part)) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "hitbox-part-delete";
        deleteButton.textContent = "삭제";
        deleteButton.addEventListener("click", () => {
          delete hitAreas[part];
          void saveStoredHitAreas(storageAdapter, hitAreas);
          renderEditorParts();
          renderDebugHitAreas();
        });
        title.appendChild(deleteButton);
      }

      group.appendChild(title);

      (["minX", "maxX", "minY", "maxY"] as Array<keyof CharacterTouchArea>).forEach((axis) => {
        const row = document.createElement("div");
        row.className = "hitbox-slider-row";

        const label = document.createElement("label");
        label.textContent = axis;

        const input = document.createElement("input");
        input.type = "range";
        input.min = "0";
        input.max = "100";

        const currentValue = hitAreas[part]?.[axis] ?? getDefaultAreaValue(part, axis);
        input.value = String(Math.round(currentValue * 100));

        const valueLabel = document.createElement("span");
        valueLabel.textContent = `${input.value}%`;

        input.addEventListener("input", (event) => {
          const target = event.target as HTMLInputElement;
          const value = Number(target.value) / 100;
          valueLabel.textContent = `${target.value}%`;

          if (!hitAreas[part]) {
            hitAreas[part] = {
              minX: getDefaultAreaValue(part, "minX"),
              maxX: getDefaultAreaValue(part, "maxX"),
              minY: getDefaultAreaValue(part, "minY"),
              maxY: getDefaultAreaValue(part, "maxY"),
            };
          }

          hitAreas[part][axis] = value;
          void saveStoredHitAreas(storageAdapter, hitAreas);
          renderDebugHitAreas();
        });

        row.append(label, input, valueLabel);
        group.appendChild(row);
      });

      editorElements.body?.appendChild(group);
    });
  };

  const handleAddClick = () => {
    if (Object.keys(hitAreas).length >= 10) {
      alert("히트박스는 최대 10개까지만 추가할 수 있습니다.");
      return;
    }

    const newPartId = prompt("추가할 히트박스 ID를 영문으로 입력하세요 (예: leg, arm)");
    if (!newPartId || newPartId.trim() === "") return;

    const cleanId = newPartId.trim();
    if (hitAreas[cleanId] || defaultParts.includes(cleanId)) {
      alert("이미 존재하는 파트 이름입니다.");
      return;
    }

    hitAreas[cleanId] = { minX: 0.4, maxX: 0.6, minY: 0.4, maxY: 0.6 };
    void saveStoredHitAreas(storageAdapter, hitAreas);
    renderEditorParts();
    renderDebugHitAreas();
  };

  const handleCloseClick = () => {
    if (editorElements.editor) {
      editorElements.editor.hidden = true;
    }

    renderDebugHitAreas();
  };

  const handleCopyClick = () => {
    const data = JSON.stringify({ hitAreas }, null, 2);
    void saveStoredHitAreas(storageAdapter, hitAreas);
    navigator.clipboard.writeText(data).then(() => {
      alert(`히트박스 설정이 클립보드에 복사되었습니다!\n\n${data}`);
    });
  };

  const handleOpenUi = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail.target === "hitbox_editor") {
      renderEditorParts();
      renderDebugHitAreas();
    }
  };

  editorElements.addButton?.addEventListener("click", handleAddClick);
  editorElements.closeButton?.addEventListener("click", handleCloseClick);
  editorElements.copyButton?.addEventListener("click", handleCopyClick);
  elements.stage.addEventListener("ghostnest:open-ui", handleOpenUi);
  cleanupCallbacks.push(() => {
    editorElements.addButton?.removeEventListener("click", handleAddClick);
    editorElements.closeButton?.removeEventListener("click", handleCloseClick);
    editorElements.copyButton?.removeEventListener("click", handleCopyClick);
    elements.stage.removeEventListener("ghostnest:open-ui", handleOpenUi);
  });

  renderEditorParts();
  renderDebugHitAreas();

  return {
    renderDebugHitAreas,
    destroy() {
      cleanupCallbacks.forEach((cleanup) => cleanup());
      elements.sprite.querySelectorAll(".debug-hit-area").forEach((element) => element.remove());
    },
  };
}
