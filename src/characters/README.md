# Character Modules

`src/characters` contains character data and visual resources.

Character modules should describe who appears, how they speak, and which images or hit areas represent them. Runtime behavior should still be mapped from `src/ghost/actions.ts`.

## Recommended Shape

Each character directory usually contains:

| File or Asset | Role |
| --- | --- |
| `index.ts` | Exports the `CharacterDefinition` used by the runtime |
| `profile.ts` | Character id, name, tone, and default expression |
| `lines.ts` | Dialogue categories used by `speak` actions |
| image files | Expression, surface, and layer resources |

## Current Examples

| Character | Role |
| --- | --- |
| `rine` | Full sample with profile, lines, expressions, surfaces, mouth layer animation, and hit areas |
| `mira` | Minimal sample with profile and lines only |

## Data Boundaries

Keep character-specific data here:

- profile and tone
- dialogue line sets
- expression images
- surface definitions
- layer frames such as mouth, eyes, ears, or accessories
- hit area coordinates

Avoid putting service-specific API calls, DB logic, menu mapping, or production secrets in character modules.

## Surfaces And Layers

`assets.expressions` is the simple expression-to-image map.

`assets.surfaces` is the richer surface map used by scripted dialogue and layer rendering. A surface can define `layers`, and each layer can provide frames for animation.

For example, Rine uses a `mouth` layer with two frames. Future characters can use the same structure for eyes, ears, tails, wings, clothes, or other parts.

## Hit Areas

`assets.hitAreas` defines normalized collision regions.

Each region uses values between `0` and `1`:

- `minX` and `maxX` are horizontal bounds.
- `minY` and `maxY` are vertical bounds.

These values are character data, not runtime code.

The hitbox editor is a development aid for finding these values visually. Its saved values should be treated as temporary overrides while authoring a character.

When the hit areas are ready to ship, copy the editor JSON into the character module so every user receives the same default:

```ts
assets: {
  hitAreas: {
    head: { minX: 0.2, maxX: 0.8, minY: 0, maxY: 0.35 },
  },
}
```

User-specific preferences should stay in `StorageAdapter`; character defaults should live in the character files.

Developer tool values can also be stored through `StorageAdapter`, including a DB-backed adapter. Treat those values as authoring or review data until they are copied into the character module.
