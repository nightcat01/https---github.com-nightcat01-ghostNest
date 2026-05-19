import type { CharacterDefinition, CharacterTouchArea } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";

const defaultHitAreas: Record<string, CharacterTouchArea> = {
  head: { minX: 0, maxX: 1, minY: 0, maxY: 0.36 },
  face: { minX: 0.22, maxX: 0.78, minY: 0.36, maxY: 0.58 },
  body: { minX: 0, maxX: 1, minY: 0.58, maxY: 1 },
};

const defaultParts = Object.keys(defaultHitAreas);

type InitHitboxEditorOptions = {
  elements: RuntimeElements;
  character: CharacterDefinition;
};

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

export function initHitboxEditor({ elements, character }: InitHitboxEditorOptions) {
  const renderDebugHitAreas = () => {
    const isEditorOpen = elements.hitboxEditor && !elements.hitboxEditor.hidden;

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

  if (!elements.hitboxEditor || !elements.hitboxEditorBody) {
    renderDebugHitAreas();
    return { renderDebugHitAreas };
  }

  const hitAreas = ensureHitAreas(character);

  const renderEditorParts = () => {
    elements.hitboxEditorBody?.replaceChildren();

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
          renderDebugHitAreas();
        });

        row.append(label, input, valueLabel);
        group.appendChild(row);
      });

      elements.hitboxEditorBody?.appendChild(group);
    });
  };

  elements.hitboxEditorAdd?.addEventListener("click", () => {
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
    renderEditorParts();
    renderDebugHitAreas();
  });

  elements.hitboxEditorClose?.addEventListener("click", () => {
    if (elements.hitboxEditor) {
      elements.hitboxEditor.hidden = true;
    }

    renderDebugHitAreas();
  });

  elements.hitboxEditorCopy?.addEventListener("click", () => {
    const data = JSON.stringify({ hitAreas }, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      alert(`히트박스 설정이 클립보드에 복사되었습니다!\n\n${data}`);
    });
  });

  elements.stage.addEventListener("ghostnest:open-ui", (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail.target === "hitbox_editor") {
      renderEditorParts();
      renderDebugHitAreas();
    }
  });

  renderEditorParts();
  renderDebugHitAreas();

  return { renderDebugHitAreas };
}
