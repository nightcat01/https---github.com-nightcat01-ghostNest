import type { ManagementMenuItem } from "../../core/types.js";

export type AssetGeneratorExtensionConfig = {
  enabled: boolean;
  devServer?: {
    bridge?: boolean;
    comfyUiUrl?: string;
    workflowPath?: string;
  };
};

export const assetGeneratorExtension = {
  id: "asset-generator",
  name: "Layer Part Generator",
  description: "Developer extension page for generating eye, mouth, and expression layer parts.",
  route: "./dev-assets.html",
  capabilities: [
    "layer-part-generation-workflow",
    "krita-ai-diffusion-recipe",
    "manifest-assets-draft",
  ],
} as const;

export const assetGeneratorExtensionConfig = {
  enabled: true,
  devServer: {
    bridge: true,
    comfyUiUrl: "http://127.0.0.1:8188",
    workflowPath: "src/devtools/layer-part-workflow.api.json",
  },
} satisfies AssetGeneratorExtensionConfig;

/**
 * Creates the Nanika menu entry that opens the asset generator extension page.
 */
export function createAssetGeneratorMenuItem(): ManagementMenuItem {
  return {
    id: assetGeneratorExtension.id,
    label: assetGeneratorExtension.name,
    description: assetGeneratorExtension.description,
    actions: [
      { type: "close_management_menu" },
      { type: "navigate", route: assetGeneratorExtension.route },
      { type: "log", label: "management.open_asset_generator" },
    ],
  };
}
