export function createLocalStorageAdapter(namespace) {
    const getStorageKey = (key) => `${namespace}:${key}`;
    return {
        get: (key) => {
            const rawValue = window.localStorage.getItem(getStorageKey(key));
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set: (key, value) => {
            window.localStorage.setItem(getStorageKey(key), JSON.stringify(value));
        },
        remove: (key) => {
            window.localStorage.removeItem(getStorageKey(key));
        },
    };
}
//# sourceMappingURL=storageAdapter.js.map