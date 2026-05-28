import type { CharacterDefinition } from "../../core/types.js";

export type CharacterCatalogItem = {
  id: string;
  name: string;
  description: string;
  defaultExpression: string;
  expressionCount: number;
  surfaceCount: number;
  sceneCount: number;
  hitAreaCount: number;
};

/**
 * Converts a character definition into display-friendly catalog metadata.
 */
export function createCharacterCatalogItem(character: CharacterDefinition): CharacterCatalogItem {
  const assets = character.assets;

  return {
    id: character.profile.id,
    name: character.profile.name,
    description: character.profile.description,
    defaultExpression: character.profile.defaultExpression,
    expressionCount: Object.keys(assets?.expressions ?? {}).length,
    surfaceCount: Object.keys(assets?.surfaces ?? {}).length,
    sceneCount: Object.keys(assets?.scenes ?? {}).length,
    hitAreaCount: Object.keys(assets?.hitAreas ?? {}).length,
  };
}
