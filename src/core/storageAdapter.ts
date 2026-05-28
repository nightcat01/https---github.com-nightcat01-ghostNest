import type { StorageAdapter } from "./types.js";

/**
 * Creates an ephemeral storage adapter for runtimes that should not persist user settings.
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const values = new Map<string, unknown>();

  return {
    get: (key: string) => values.get(key) ?? null,
    set: (key: string, value: unknown) => {
      values.set(key, value);
    },
    remove: (key: string) => {
      values.delete(key);
    },
  };
}

export function createLocalStorageAdapter(namespace: string): StorageAdapter {
  const getStorageKey = (key: string) => `${namespace}:${key}`;

  return {
    get: (key: string) => {
      const rawValue = window.localStorage.getItem(getStorageKey(key));
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set: (key: string, value: unknown) => {
      window.localStorage.setItem(getStorageKey(key), JSON.stringify(value));
    },
    remove: (key: string) => {
      window.localStorage.removeItem(getStorageKey(key));
    },
  };
}
