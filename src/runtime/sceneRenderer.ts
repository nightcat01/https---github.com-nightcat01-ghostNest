import type { RuntimeScene, RuntimeSceneLayer, RuntimeSceneOptions } from "../core/types.js";
import type { RuntimeElements } from "./domElements.js";

type SceneRendererOptions = {
  elements: RuntimeElements;
  scene: RuntimeSceneOptions | undefined;
};

const defaultCharacterSceneDepth = 10;

/**
 * Picks one scene definition from either a named scene, a named scene set, or the legacy layer list.
 */
function resolveScene(scene: RuntimeSceneOptions | undefined): RuntimeScene | null {
  if (!scene) {
    return null;
  }

  const defaultSceneId = scene.defaultScene;

  if (defaultSceneId && scene.scenes?.[defaultSceneId]) {
    return scene.scenes[defaultSceneId];
  }

  const sceneSet = defaultSceneId ? scene.sceneSets?.[defaultSceneId] : null;

  if (sceneSet && sceneSet.length > 0) {
    return sceneSet[Math.floor(Math.random() * sceneSet.length)] ?? sceneSet[0] ?? null;
  }

  if (scene.layers) {
    return {
      id: "legacy",
      layers: scene.layers,
    };
  }

  const firstScene = Object.values(scene.scenes ?? {})[0];

  if (firstScene) {
    return firstScene;
  }

  const firstSceneSet = Object.values(scene.sceneSets ?? {})[0];

  if (firstSceneSet && firstSceneSet.length > 0) {
    return firstSceneSet[Math.floor(Math.random() * firstSceneSet.length)] ?? firstSceneSet[0] ?? null;
  }

  return null;
}

/**
 * Applies normalized placement data to a stage layer element.
 */
function applySceneLayerPlacement(element: HTMLElement, layer: RuntimeSceneLayer) {
  const placement = layer.placement;

  if (!placement) {
    element.dataset.placement = "full";
    return;
  }

  element.dataset.placement = placement.unit ?? "percent";
  element.style.left = `${placement.x}%`;
  element.style.top = `${placement.y}%`;
  element.style.width = `${placement.width}%`;
  element.style.height = `${placement.height}%`;
}

/**
 * Creates one DOM node for a configured stage layer.
 */
function createSceneLayerElement(layer: RuntimeSceneLayer) {
  const layerElement = document.createElement("div");

  layerElement.className = ["scene-layer", layer.className].filter(Boolean).join(" ");
  layerElement.dataset.layerId = layer.id;
  layerElement.dataset.layerRole = layer.role;
  layerElement.style.zIndex = String(layer.depth ?? 0);
  applySceneLayerPlacement(layerElement, layer);

  if (layer.color) {
    layerElement.style.background = layer.color;
  }

  if (layer.image) {
    const image = document.createElement("img");

    image.src = layer.image;
    image.alt = layer.alt ?? "";
    image.draggable = false;
    image.setAttribute("aria-hidden", layer.alt ? "false" : "true");
    layerElement.append(image);
  }

  return layerElement;
}

/**
 * Skips placeholder scene layers until they have real visual content.
 */
function isRenderableSceneLayer(layer: RuntimeSceneLayer) {
  if (layer.image || layer.color) {
    return true;
  }

  return layer.role === "background";
}

/**
 * Finds the depth assigned to the character slot in a scene layer stack.
 */
function getCharacterSceneDepth(layers: RuntimeSceneLayer[]) {
  return layers.find((layer) => layer.role === "character")?.depth ?? defaultCharacterSceneDepth;
}

/**
 * Renders stage-level composition layers such as backgrounds, desks, foreground props, and effects.
 */
export function createSceneRenderer({ elements, scene }: SceneRendererOptions) {
  const layerRoot = document.createElement("div");
  const selectedScene = resolveScene(scene);

  layerRoot.className = "scene-layer-root";
  layerRoot.setAttribute("aria-hidden", "true");
  elements.stage.prepend(layerRoot);

  /**
   * Rebuilds the stage layer stack from runtime configuration.
   */
  function render() {
    layerRoot.replaceChildren();
    elements.stage.dataset.sceneId = selectedScene?.id ?? "";
    elements.stage.style.setProperty("--character-scene-depth", String(getCharacterSceneDepth(selectedScene?.layers ?? [])));

    selectedScene?.layers
      ?.slice()
      .filter((layer) => layer.role !== "character")
      .filter(isRenderableSceneLayer)
      .sort((current, next) => (current.depth ?? 0) - (next.depth ?? 0))
      .forEach((layer) => {
        layerRoot.append(createSceneLayerElement(layer));
      });
  }

  /**
   * Removes stage layer DOM owned by this renderer.
   */
  function destroy() {
    layerRoot.remove();
  }

  render();

  return {
    destroy,
    render,
  };
}
