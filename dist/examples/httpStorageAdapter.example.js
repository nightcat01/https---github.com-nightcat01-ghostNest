async function resolveAuthHeaders(options) {
    return (await options.getAuthHeaders?.()) ?? {};
}
function createSettingUrl(baseUrl, key) {
    return `${baseUrl.replace(/\/$/, "")}/settings/${encodeURIComponent(key)}`;
}
async function readJsonValue(response) {
    const payload = await response.json();
    return payload.value ?? null;
}
/**
 * Example StorageAdapter for services that persist GhostNest settings through an HTTP API.
 * The server, database, authentication, and user scoping behind these endpoints are app responsibilities.
 */
export function createHttpStorageAdapter(options) {
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
//# sourceMappingURL=httpStorageAdapter.example.js.map