# Sample Runtime Plugins

`src/plugins` contains sample `RuntimePlugin` implementations used by the demo preset.

Plugins are the boundary for external features such as API calls, DB lookups, AI responses, minigames, stores, or service-specific tools. GhostNest calls them through the `call_plugin` action and renders their `PluginResult`.

## Current Samples

| Plugin | Role |
| --- | --- |
| `fortune` | Returns a local dummy fortune result |
| `weather` | Calls a public weather API as an external API example |
| `systemInfo` | Reads browser/system information when available |
| `timer` | Returns a timer setup message while the action mapping starts the actual timer |
| `minigame` | Creates rock-paper-scissors plugin variants |

## Service Code

For a real service, keep API keys, DB credentials, and business logic outside the GhostNest core.

Prefer this flow:

1. Implement the service call in your app or adapter layer.
2. Wrap it as a `RuntimePlugin`.
3. Register it in `src/ghost/nanika.config.ts`.
4. Call it from `src/ghost/actions.ts` with `{ type: "call_plugin", pluginId: "..." }`.

Do not add production secrets to these demo plugin files.
