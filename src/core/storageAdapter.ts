import type { StorageAdapter } from "./types.js";

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
