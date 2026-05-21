# Demo Presets

`src/demo` contains sample presets that demonstrate how GhostNest features are mapped.

This directory is not the main developer surface. The main service-facing files live in `src/ghost`.

## Files

| File | Role |
| --- | --- |
| `demoPlugins.ts` | Registers sample plugins such as fortune, weather, timer, system info, and minigame |
| `demoManagementMenu.ts` | Composes the sample management menu from smaller menu presets |
| `demoRules.ts` | Maps sample runtime events to action arrays |
| `menuPresets/` | Keeps demo menu item groups split by purpose |

## Menu Presets

| File | Role |
| --- | --- |
| `menuPresets/dialogueMenuItems.ts` | Dialogue and DialogueScript examples |
| `menuPresets/pluginMenuItems.ts` | Plugin, nested menu, minigame, and timer examples |
| `menuPresets/uiMenuItems.ts` | Balloon, font size, and menu display options |
| `menuPresets/characterMenuItems.ts` | Character animation, visibility, and devtool entries |
| `menuPresets/developerMenuItems.ts` | Developer-only diagnostics and editor entries |

Menu presets are split by feature group, not by every single menu item.

Split a preset further only when one group becomes hard to scan, or when a nested menu grows into an independent sample. Keeping every small item in its own file usually makes the demo harder to follow.

Some presets can receive the active character definition. For example, `characterMenuItems.ts` builds the mouth animation test list from surfaces that actually define a `mouth` layer or `mouthImages`.

Developer tools are grouped under a separate `developer-tools` menu when `includeDeveloperTools` is enabled.

```ts
createDemoManagementMenuItems(character, {
  includeDeveloperTools: true,
});
```

Turn this option off or replace the menu preset when shipping a user-only service surface.

## How To Use

The default `src/ghost` files import these demo presets so the project works out of the box.

For a real service, prefer one of these flows:

1. Keep the demo preset and add service-specific plugins or menu items in `src/ghost`.
2. Replace the demo preset imports in `src/ghost` with your own plugin, menu, and rule definitions.
3. Copy only the useful patterns from this directory, then keep service code outside `src/demo`.

Avoid putting API keys, production DB calls, or service-specific business logic in this directory.
