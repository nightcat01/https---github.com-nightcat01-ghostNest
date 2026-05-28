import type { ManagementMenuItem } from "../../core/types.js";

export type ComfyAssetGeneratorExtensionConfig = {
  enabled: boolean;
  devServer?: {
    bridge?: boolean;
    comfyUiUrl?: string;
    workflowPath?: string;
  };
};

export const comfyAssetGeneratorExtension = {
  id: "comfy-asset-generator",
  name: "Comfy Asset Generator",
  description: "Developer extension page for generating character asset parts through ComfyUI.",
  route: "./dev-assets-comfy.html",
  capabilities: [
    "comfyui-bridge",
    "layer-part-generation-workflow",
    "krita-ai-diffusion-recipe",
  ],
} as const;

export const comfyAssetGeneratorExtensionConfig = {
  enabled: false,
  devServer: {
    bridge: true,
    comfyUiUrl: "http://127.0.0.1:8188",
    workflowPath: "src/devtools/layer-part-workflow.api.json",
  },
} satisfies ComfyAssetGeneratorExtensionConfig;

/**
 * Creates the developer menu entry that opens the Comfy asset generator.
 */
export function createComfyAssetGeneratorMenuItem(): ManagementMenuItem {
  return {
    id: comfyAssetGeneratorExtension.id,
    label: comfyAssetGeneratorExtension.name,
    description: comfyAssetGeneratorExtension.description,
    actions: [
      { type: "close_management_menu" },
      { type: "navigate", route: comfyAssetGeneratorExtension.route },
      { type: "log", label: "management.open_comfy_asset_generator" },
    ],
  };
}
