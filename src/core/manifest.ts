import { createGhostRuntime } from "../runtime/createGhostRuntime.js";
import type {
  CharacterDefinition,
  GhostRuntime,
  GhostRuntimeOptions,
  ManagementMenuItem,
  RuntimePlugin,
  RuntimeRule,
} from "./types.js";

export type GhostManifestDependencyMap = Record<string, string>;

export type GhostManifest = {
  id: string;
  name: string;
  version?: string;
  character: CharacterDefinition;
  menus?: ManagementMenuItem[];
  plugins?: RuntimePlugin[];
  rules?: RuntimeRule[];
  capabilities?: string[];
  dependencies?: GhostManifestDependencyMap;
};

export type GhostManifestRuntimeOptions = Omit<
  GhostRuntimeOptions,
  "character" | "plugins" | "rules"
> & {
  plugins?: RuntimePlugin[];
  rules?: RuntimeRule[];
};

/**
 * Converts a portable manifest into concrete runtime options for the host page.
 */
export function createGhostRuntimeOptionsFromManifest(
  manifest: GhostManifest,
  options: GhostManifestRuntimeOptions,
): GhostRuntimeOptions {
  return {
    ...options,
    character: manifest.character,
    plugins: [...(manifest.plugins ?? []), ...(options.plugins ?? [])],
    rules: [...(manifest.rules ?? []), ...(options.rules ?? [])],
  };
}

/**
 * Creates a runtime from a manifest while keeping DOM selectors and host settings outside the manifest.
 */
export function createGhostRuntimeFromManifest(
  manifest: GhostManifest,
  options: GhostManifestRuntimeOptions,
): GhostRuntime {
  return createGhostRuntime(createGhostRuntimeOptionsFromManifest(manifest, options));
}
