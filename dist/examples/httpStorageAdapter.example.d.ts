import type { StorageAdapter } from "../core/types.js";
type HttpStorageAdapterOptions = {
    baseUrl: string;
    getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
};
/**
 * Example StorageAdapter for services that persist GhostNest settings through an HTTP API.
 * The server, database, authentication, and user scoping behind these endpoints are app responsibilities.
 */
export declare function createHttpStorageAdapter(options: HttpStorageAdapterOptions): StorageAdapter;
export {};
//# sourceMappingURL=httpStorageAdapter.example.d.ts.map