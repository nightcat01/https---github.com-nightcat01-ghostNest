import type {
  CharacterDefinition,
  CharacterExpression,
  CharacterLayer,
  CharacterLayerId,
  CharacterRuntimeMode,
  CharacterSurface,
  RuntimeState,
} from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";

type CharacterRendererOptions = {
  elements: RuntimeElements;
  character: CharacterDefinition;
};

function pickExpressionAsset(asset: string | string[] | undefined, currentAsset: string | null) {
  if (!asset) {
    return null;
  }

  if (typeof asset === "string") {
    return asset;
  }

  if (asset.length === 0) {
    return null;
  }

  const candidates = asset.length > 1 ? asset.filter((candidate) => candidate !== currentAsset) : asset;
  const index = Math.floor(Math.random() * candidates.length);

  return candidates[index] ?? asset[0] ?? null;
}

function setupSpriteLayerElements(sprite: HTMLButtonElement, baseImage: HTMLImageElement) {
  const layers = new Map<CharacterLayerId, HTMLImageElement>();

  baseImage.classList.add("character-sprite-layer");
  baseImage.dataset.layerId = "base";
  layers.set("base", baseImage);

  return layers;
}

function getSurfaceBaseImage(surface: CharacterSurface) {
  return surface.layers?.base?.image ?? surface.image ?? null;
}

function getSurfaceLayer(surface: CharacterSurface | null, layerId: CharacterLayerId): CharacterLayer | null {
  if (!surface) {
    return null;
  }

  const layer = surface.layers?.[layerId];

  if (layer) {
    return layer;
  }

  if (layerId === "mouth" && surface.mouthImages) {
    return {
      frames: [surface.mouthImages.closed, surface.mouthImages.open],
      intervalMs: 140,
      coversBase: true,
    };
  }

  return null;
}

function getLayerFrame(layer: CharacterLayer, frameIndex: number) {
  return layer.frames?.[frameIndex] ?? layer.image ?? null;
}

function getRenderableLayerIds(surface: CharacterSurface): CharacterLayerId[] {
  const layerIds = Object.keys(surface.layers ?? {}).filter((layerId) => layerId !== "base") as CharacterLayerId[];

  if (surface.mouthImages && !layerIds.includes("mouth")) {
    layerIds.push("mouth");
  }

  return layerIds;
}

function isFullCoverLayer(layer: CharacterLayer) {
  return Boolean(layer.coversBase && !layer.placement);
}

function shouldKeepLayerVisibleWhenInactive(layer: CharacterLayer) {
  return Boolean(!isFullCoverLayer(layer) && !layer.idleIntervalMs);
}

function canRunIdleLayer(layerId: CharacterLayerId, layer: CharacterLayer) {
  return layerId !== "mouth" && (layer.idleIntervalMs ?? 0) > 0;
}

function resetLayerPlacement(layerElement: HTMLImageElement) {
  layerElement.style.removeProperty("left");
  layerElement.style.removeProperty("top");
  layerElement.style.removeProperty("width");
  layerElement.style.removeProperty("height");
  layerElement.style.removeProperty("z-index");
  layerElement.dataset.placement = "full";
}

function applyLayerPlacement(layerElement: HTMLImageElement, layer: CharacterLayer) {
  const placement = layer.placement;

  if (!placement) {
    resetLayerPlacement(layerElement);
    layerElement.style.zIndex = String(layer.depth ?? 10);
    return;
  }

  layerElement.dataset.placement = placement.unit ?? "percent";
  layerElement.style.left = `${placement.x}%`;
  layerElement.style.top = `${placement.y}%`;
  layerElement.style.width = `${placement.width}%`;
  layerElement.style.height = `${placement.height}%`;
  layerElement.style.zIndex = String(layer.depth ?? 10);
}

/**
 * Creates the DOM renderer for character expressions, surfaces, and layer animations.
 * This module owns visual state only; actions and rules decide when the state changes.
 */
export function createCharacterRenderer({ elements, character }: CharacterRendererOptions) {
  const spriteLayers = setupSpriteLayerElements(elements.sprite, elements.spriteImage);
  const activeLayerAnimations = new Map<CharacterLayerId, number>();
  const activeLayerIds = new Set<CharacterLayerId>();
  const idleLayerAnimations = new Map<CharacterLayerId, number>();
  let currentSurface: CharacterSurface | null = null;

  function getLayerElement(layerId: CharacterLayerId) {
    const existingLayerElement = spriteLayers.get(layerId);

    if (existingLayerElement) {
      return existingLayerElement;
    }

    const layerImage = document.createElement("img");

    layerImage.className = "character-sprite-layer";
    layerImage.dataset.layerId = layerId;
    layerImage.alt = "";
    layerImage.hidden = true;
    layerImage.setAttribute("aria-hidden", "true");
    elements.sprite.append(layerImage);
    spriteLayers.set(layerId, layerImage);

    return layerImage;
  }

  function findSurfaceForExpression(expression: CharacterExpression, baseImage: string | null) {
    const surfaces = character.assets?.surfaces;

    if (!surfaces) {
      return null;
    }

    return Object.values(surfaces).find((surface) =>
      surface.expression === expression && (!baseImage || getSurfaceBaseImage(surface) === baseImage),
    ) ?? null;
  }

  function clearPartLayers() {
    spriteLayers.forEach((layerElement, layerId) => {
      if (layerId === "base") {
        return;
      }

      layerElement.removeAttribute("src");
      resetLayerPlacement(layerElement);
      layerElement.hidden = true;
    });
  }

  function preloadSurfaceImages(surface: CharacterSurface) {
    const layerImages = Object.values(surface.layers ?? {}).flatMap((layer) => {
      if (!layer) {
        return [];
      }

      return [
        ...(layer.image ? [layer.image] : []),
        ...(layer.frames ?? []),
      ];
    });

    if (surface.mouthImages) {
      layerImages.push(surface.mouthImages.closed, surface.mouthImages.open);
    }

    layerImages.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }

  function renderStaticPartLayers(surface: CharacterSurface) {
    clearPartLayers();

    getRenderableLayerIds(surface).forEach((layerId) => {
      const layer = getSurfaceLayer(surface, layerId);

      if (!layer || layer.coversBase || layer.idleIntervalMs) {
        return;
      }

      const layerImage = getLayerFrame(layer, 0);
      const layerElement = getLayerElement(layerId);

      if (!layerImage) {
        return;
      }

      applyLayerPlacement(layerElement, layer);
      layerElement.src = layerImage;
      layerElement.hidden = false;
    });
  }

  function applySurfaceDefinition(surface: CharacterSurface) {
    const baseImage = getSurfaceBaseImage(surface);

    currentSurface = surface;
    preloadSurfaceImages(surface);
    elements.sprite.dataset.surfaceId = surface.id;
    elements.spriteImage.alt = surface.alt ?? character.assets?.alt ?? character.profile.name;

    if (baseImage && elements.spriteImage.getAttribute("src") !== baseImage) {
      elements.spriteImage.src = baseImage;
    }

    elements.spriteImage.hidden = false;
    renderStaticPartLayers(surface);
  }

  function applyPartFrame(layerId: CharacterLayerId, layer: CharacterLayer, frameIndex: number, isActive: boolean) {
    const layerElement = getLayerElement(layerId);
    const nextImage = getLayerFrame(layer, frameIndex);

    if (!nextImage) {
      return;
    }

    if (layerElement.getAttribute("src") !== nextImage) {
      layerElement.src = nextImage;
    }

    applyLayerPlacement(layerElement, layer);
    layerElement.hidden = false;

    if (isActive && isFullCoverLayer(layer)) {
      elements.spriteImage.hidden = true;
      spriteLayers.forEach((otherLayerElement, otherLayerId) => {
        if (otherLayerId === layerId) {
          return;
        }

        if (otherLayerId !== "base") {
          otherLayerElement.hidden = true;
        }
      });
    }
  }

  function stopLayerAnimation(layerId: CharacterLayerId) {
    const timerId = activeLayerAnimations.get(layerId);

    if (timerId !== undefined) {
      window.clearInterval(timerId);
      activeLayerAnimations.delete(layerId);
    }
  }

  function stopIdleLayerAnimations() {
    idleLayerAnimations.forEach((timerId) => window.clearInterval(timerId));
    idleLayerAnimations.clear();
  }

  function hasActiveFullCoverLayer() {
    return Array.from(activeLayerIds).some((activeLayerId) => {
      const activeLayer = getSurfaceLayer(currentSurface, activeLayerId);

      return activeLayer ? isFullCoverLayer(activeLayer) : false;
    });
  }

  function setLayerAnimationActive(layerId: CharacterLayerId, isActive: boolean) {
    stopLayerAnimation(layerId);

    const layer = getSurfaceLayer(currentSurface, layerId);
    const layerElement = spriteLayers.get(layerId);

    if (!isActive || !layer) {
      activeLayerIds.delete(layerId);

      if (!hasActiveFullCoverLayer()) {
        elements.spriteImage.hidden = false;
      }

      if (layer && shouldKeepLayerVisibleWhenInactive(layer)) {
        applyPartFrame(layerId, layer, 0, false);
      } else if (layerElement) {
        layerElement.hidden = true;
      }

      return;
    }

    const frameCount = Math.max(layer.frames?.length ?? 0, layer.image ? 1 : 0);

    if (frameCount <= 0) {
      return;
    }

    if (hasActiveFullCoverLayer() && !isFullCoverLayer(layer)) {
      return;
    }

    activeLayerIds.add(layerId);
    let frameIndex = frameCount > 1 ? 1 : 0;
    applyPartFrame(layerId, layer, frameIndex, true);

    if (frameCount <= 1) {
      return;
    }

    const timerId = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frameCount;
      applyPartFrame(layerId, layer, frameIndex, true);
    }, layer.intervalMs ?? 140);

    activeLayerAnimations.set(layerId, timerId);
  }

  function setMouthAnimationActive(isActive: boolean) {
    setLayerAnimationActive("mouth", isActive);
  }

  function stopLayerAnimations() {
    Array.from(activeLayerIds).forEach((layerId) => setLayerAnimationActive(layerId, false));
  }

  function startIdleLayerAnimations(surface: CharacterSurface) {
    stopIdleLayerAnimations();

    getRenderableLayerIds(surface).forEach((layerId) => {
      const layer = getSurfaceLayer(surface, layerId);
      if (!layer || !canRunIdleLayer(layerId, layer)) {
        return;
      }

      const timerId = window.setInterval(() => {
        if (activeLayerIds.has(layerId) || hasActiveFullCoverLayer()) {
          return;
        }

        const frameCount = Math.max(layer.frames?.length ?? 0, layer.image ? 1 : 0);
        const playbackMs = Math.max(layer.intervalMs ?? 140, 40) * Math.max(frameCount, 1);

        setLayerAnimationActive(layerId, true);
        window.setTimeout(() => {
          setLayerAnimationActive(layerId, false);
        }, playbackMs);
      }, layer.idleIntervalMs ?? 0);

      idleLayerAnimations.set(layerId, timerId);
    });
  }

  function renderState(state: Pick<RuntimeState, "expression" | "lastTouchedPart">) {
    stopLayerAnimations();
    stopIdleLayerAnimations();
    elements.sprite.dataset.expression = state.expression;
    elements.spriteImage.alt = character.assets?.alt ?? character.profile.name;

    const expressionAsset = character.assets
      ? pickExpressionAsset(character.assets.expressions[state.expression], elements.spriteImage.getAttribute("src"))
      : null;
    const surface = findSurfaceForExpression(state.expression, expressionAsset);

    if (surface) {
      applySurfaceDefinition(surface);
      startIdleLayerAnimations(surface);
    } else {
      currentSurface = null;
      delete elements.sprite.dataset.surfaceId;
      clearPartLayers();

      if (expressionAsset && elements.spriteImage.getAttribute("src") !== expressionAsset) {
        elements.spriteImage.src = expressionAsset;
      }

      elements.spriteImage.hidden = false;
    }

    if (state.lastTouchedPart) {
      elements.sprite.dataset.touchedPart = state.lastTouchedPart;
      return;
    }

    delete elements.sprite.dataset.touchedPart;
  }

  function applySurface(surfaceId: string, options: { startIdleLayers?: boolean } = {}) {
    const surface = character.assets?.surfaces?.[surfaceId];

    if (!surface) {
      elements.stage.dispatchEvent(new CustomEvent("ghostnest:surface-missing", { detail: { id: surfaceId } }));
      return;
    }

    stopLayerAnimations();
    stopIdleLayerAnimations();
    applySurfaceDefinition(surface);
    if (options.startIdleLayers ?? true) {
      startIdleLayerAnimations(surface);
    }
  }

  function setMode(mode: CharacterRuntimeMode) {
    elements.stage.dataset.state = mode;
  }

  function destroy() {
    stopLayerAnimations();
    stopIdleLayerAnimations();
  }

  return {
    applySurface,
    destroy,
    renderState,
    setLayerAnimationActive,
    setMode,
    setMouthAnimationActive,
  };
}
