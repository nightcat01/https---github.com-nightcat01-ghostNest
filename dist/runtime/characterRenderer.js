const spriteLayerIds = ["ears", "eyes", "mouth", "accessory"];
function pickExpressionAsset(asset, currentAsset) {
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
function setupSpriteLayerElements(sprite, baseImage) {
    const layers = new Map();
    baseImage.classList.add("character-sprite-layer");
    baseImage.dataset.layerId = "base";
    layers.set("base", baseImage);
    spriteLayerIds.forEach((layerId) => {
        const layerImage = document.createElement("img");
        layerImage.className = "character-sprite-layer";
        layerImage.dataset.layerId = layerId;
        layerImage.alt = "";
        layerImage.hidden = true;
        layerImage.setAttribute("aria-hidden", "true");
        sprite.append(layerImage);
        layers.set(layerId, layerImage);
    });
    return layers;
}
function getSurfaceBaseImage(surface) {
    return surface.layers?.base?.image ?? surface.image ?? null;
}
function getSurfaceLayer(surface, layerId) {
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
function getLayerFrame(layer, frameIndex) {
    return layer.frames?.[frameIndex] ?? layer.image ?? null;
}
/**
 * Creates the DOM renderer for character expressions, surfaces, and layer animations.
 * This module owns visual state only; actions and rules decide when the state changes.
 */
export function createCharacterRenderer({ elements, character }) {
    const spriteLayers = setupSpriteLayerElements(elements.sprite, elements.spriteImage);
    const activeLayerAnimations = new Map();
    let currentSurface = null;
    function findSurfaceForExpression(expression) {
        const surfaces = character.assets?.surfaces;
        if (!surfaces) {
            return null;
        }
        return Object.values(surfaces).find((surface) => surface.expression === expression) ?? null;
    }
    function clearPartLayers() {
        spriteLayerIds.forEach((layerId) => {
            const layerElement = spriteLayers.get(layerId);
            if (!layerElement) {
                return;
            }
            layerElement.removeAttribute("src");
            layerElement.hidden = true;
        });
    }
    function preloadSurfaceImages(surface) {
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
    function renderStaticPartLayers(surface) {
        clearPartLayers();
        spriteLayerIds.forEach((layerId) => {
            const layer = getSurfaceLayer(surface, layerId);
            if (!layer || layer.coversBase) {
                return;
            }
            const layerImage = getLayerFrame(layer, 0);
            const layerElement = spriteLayers.get(layerId);
            if (!layerImage || !layerElement) {
                return;
            }
            layerElement.src = layerImage;
            layerElement.hidden = false;
        });
    }
    function applySurfaceDefinition(surface) {
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
    function applyPartFrame(layerId, layer, frameIndex, isActive) {
        const layerElement = spriteLayers.get(layerId);
        const nextImage = getLayerFrame(layer, frameIndex);
        if (!layerElement || !nextImage) {
            return;
        }
        if (layerElement.getAttribute("src") !== nextImage) {
            layerElement.src = nextImage;
        }
        layerElement.hidden = false;
        if (layer.coversBase) {
            elements.spriteImage.hidden = isActive;
        }
    }
    function stopLayerAnimation(layerId) {
        const timerId = activeLayerAnimations.get(layerId);
        if (timerId !== undefined) {
            window.clearInterval(timerId);
            activeLayerAnimations.delete(layerId);
        }
    }
    function setLayerAnimationActive(layerId, isActive) {
        stopLayerAnimation(layerId);
        const layer = getSurfaceLayer(currentSurface, layerId);
        const layerElement = spriteLayers.get(layerId);
        if (!isActive || !layer) {
            if (!Array.from(activeLayerAnimations.keys()).some((activeLayerId) => getSurfaceLayer(currentSurface, activeLayerId)?.coversBase)) {
                elements.spriteImage.hidden = false;
            }
            if (layer && !layer.coversBase) {
                applyPartFrame(layerId, layer, 0, false);
            }
            else if (layerElement) {
                layerElement.hidden = true;
            }
            return;
        }
        const frameCount = Math.max(layer.frames?.length ?? 0, layer.image ? 1 : 0);
        if (frameCount <= 0) {
            return;
        }
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
    function setMouthAnimationActive(isActive) {
        setLayerAnimationActive("mouth", isActive);
    }
    function stopLayerAnimations() {
        Array.from(activeLayerAnimations.keys()).forEach((layerId) => setLayerAnimationActive(layerId, false));
    }
    function renderState(state) {
        stopLayerAnimations();
        elements.sprite.dataset.expression = state.expression;
        elements.spriteImage.alt = character.assets?.alt ?? character.profile.name;
        const surface = findSurfaceForExpression(state.expression);
        if (surface) {
            applySurfaceDefinition(surface);
        }
        else {
            currentSurface = null;
            delete elements.sprite.dataset.surfaceId;
            clearPartLayers();
            const expressionAsset = character.assets
                ? pickExpressionAsset(character.assets.expressions[state.expression], elements.spriteImage.getAttribute("src"))
                : null;
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
    function applySurface(surfaceId) {
        const surface = character.assets?.surfaces?.[surfaceId];
        if (!surface) {
            elements.stage.dispatchEvent(new CustomEvent("ghostnest:surface-missing", { detail: { id: surfaceId } }));
            return;
        }
        applySurfaceDefinition(surface);
    }
    function setMode(mode) {
        elements.stage.dataset.state = mode;
    }
    function destroy() {
        stopLayerAnimations();
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
//# sourceMappingURL=characterRenderer.js.map