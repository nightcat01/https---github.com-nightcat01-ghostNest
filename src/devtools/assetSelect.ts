import type { AssetFile } from "./assetApi.js";

/**
 * Filters saved assets by kind and optional shared scope.
 */
export function filterAssetFiles(
  assetFiles: AssetFile[],
  kinds: AssetFile["kind"][],
  options: { includeCommon?: boolean } = {},
) {
  const includeCommon = options.includeCommon ?? true;

  return assetFiles.filter((assetFile) =>
    kinds.includes(assetFile.kind) && (includeCommon || assetFile.scope !== "common"),
  );
}

/**
 * Builds a compact label that still exposes character/common origin.
 */
export function createAssetOptionLabel(assetFile: AssetFile) {
  const trimmedPath = assetFile.path
    .replace("./src/characters/", "")
    .replace("./src/assets/common/", "common/");
  const prefix = assetFile.scope === "common" ? "공통 / " : "";

  return `${prefix}${trimmedPath}`;
}

/**
 * Appends optgroups for character-owned assets and reusable common assets.
 */
export function appendAssetOptionGroups(
  select: HTMLSelectElement,
  assetFiles: AssetFile[],
  labels: { character?: string; common?: string } = {},
) {
  const characterAssets = assetFiles.filter((assetFile) => assetFile.scope !== "common");
  const commonAssets = assetFiles.filter((assetFile) => assetFile.scope === "common");

  [
    [labels.character ?? "캐릭터 에셋", characterAssets],
    [labels.common ?? "공통 에셋", commonAssets],
  ].forEach(([label, files]) => {
    if (!Array.isArray(files) || files.length === 0) {
      return;
    }

    const group = document.createElement("optgroup");

    group.label = `${label} (${files.length})`;
    files.forEach((assetFile) => {
      group.append(new Option(createAssetOptionLabel(assetFile), assetFile.path));
    });
    select.append(group);
  });
}
