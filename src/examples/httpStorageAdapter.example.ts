import type { StorageAdapter } from "../core/types.js";

type HttpStorageAdapterOptions = {
  baseUrl: string;
  getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
};

async function resolveAuthHeaders(options: HttpStorageAdapterOptions) {
  return (await options.getAuthHeaders?.()) ?? {};
}

function createSettingUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/$/, "")}/settings/${encodeURIComponent(key)}`;
}

async function readJsonValue(response: Response) {
  const payload = await response.json() as { value?: unknown };
  return payload.value ?? null;
}

/**
 * Example StorageAdapter for services that persist GhostNest settings through an HTTP API.
 * The server, database, authentication, and user scoping behind these endpoints are app responsibilities.
 */
export function createHttpStorageAdapter(options: HttpStorageAdapterOptions): StorageAdapter {
  return {
    async get(key) {
      const response = await fetch(createSettingUrl(options.baseUrl, key), {
        headers: await resolveAuthHeaders(options),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to load GhostNest setting: ${key}`);
      }

      return readJsonValue(response);
    },

    async set(key, value) {
      const response = await fetch(createSettingUrl(options.baseUrl, key), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...await resolveAuthHeaders(options),
        },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save GhostNest setting: ${key}`);
      }
    },

    async remove(key) {
      const response = await fetch(createSettingUrl(options.baseUrl, key), {
        method: "DELETE",
        headers: await resolveAuthHeaders(options),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to remove GhostNest setting: ${key}`);
      }
    },
  };
}
