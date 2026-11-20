# Scene plan for CLAD — Memory Place

The code is already written. This plan is the exact authored hierarchy CLAD must create and wire. Do not rewrite the scripts; attach them and wire the inputs.

## Hierarchy

```
ThemeManager
UIRoot
MemoryPlaceRoot
  AnchorRoot
Camera
Lighting
Tests
```

- The Base Template already has `Camera`, `Lighting` and the render target. Keep them; do not duplicate them.
- `ThemeManager` first in root order, with `Packages/UIKit.lspkg/Scripts/Themes/ThemeManager.ts` and `_theme = "System3"` if UIKit is installed. If the project does not use UIKit, skip it.
- `MemoryPlaceRoot` has `Assets/Scripts/MemoryPlaceMain.ts`.
- `AnchorRoot` is an empty SceneObject at `(0, 0, 0)`.
- `UIRoot` is a root SceneObject at `(0, 0, -110)` with `Assets/Scripts/MemoryPlaceUI.ts`. It must sit **above** `MemoryPlaceRoot` in root order: `MemoryPlaceMain.onAwake` calls `ui.attachAnchorLabel`, which fails with `undefined is not a function` if `MemoryPlaceUI` is not awake yet (children awake after their parent).
- `Camera` must have `DeviceTracking` with `Tracking Mode: World`.
- `Tests` is an empty SceneObject with `Assets/Tests/LeafIndex.ts`, so LEAF can register the scenarios.

## Wire the inputs

On `MemoryPlaceRoot`'s `MemoryPlaceMain` component:

| Input | Value |
|---|---|
| `ui` | `UIRoot`'s `MemoryPlaceUI` ScriptComponent UUID |
| `anchorRoot` | `AnchorRoot` SceneObject UUID |
| `debugColliders` | `false` |

On `UIRoot`'s `MemoryPlaceUI` component:

| Input | Value |
|---|---|
| `panelRoot` | `UIRoot` SceneObject UUID |
| `debugColliders` | `false` |

`ui` is a script-component reference, so wire it with `scene-graphql setProperty` and `valueType: REFERENCE`, `value: "<MemoryPlaceUI component UUID>"`. `anchorRoot` and `panelRoot` are SceneObject references.

## What the scripts create at runtime

- `MemoryPlaceMain` creates six place SceneObjects under `AnchorRoot`, each with a 24 cm box collider and an `Interactable`.
- `MemoryPlaceUI` creates the title, prompt, English translation, sensory cue, caregiver note, Repeat, Next, Home, Caregiver and End under `UIRoot`.
- The six places are placed at the positions in `devpost/memory-place.json`, multiplied by 100 (metres to centimetres).

## Accessibility checks

1. The prompt is 4.4 cm tall at 1.5 m, the cue 3.0 cm and the caregiver note 2.8 cm.
2. The caregiver note is hidden until Caregiver is pinched.
3. Repeat, Next, Home, Caregiver and End are at least 22 cm and do not overlap.
4. There is no red error state, score, timer or countdown.
5. The session end is a thank-you screen, not a failure screen.

## Verify

1. Recompile TypeScript; fix any unresolved import.
2. Run the preview. The logs must show no `Input ui was not provided` and no `Input anchorRoot was not provided`.
3. Pinch a place: the card must appear with one prompt, one translation and one sensory cue.
4. Pinch Repeat: the same card must remain.
5. Pinch Next: the next memory must appear.
6. Pinch Caregiver: the follow-up must appear; pinch again to hide it.
7. Pinch Home: the welcome state must return. Pinch End: the thank-you screen must appear.
8. Save the project so the authored roots and wiring persist.

## LEAF tests

Install LEAF from the Asset Library. The scenarios are already in `Assets/Tests/`; add `LeafIndex` to a `Tests` SceneObject and run them in the LEAF panel. The core logic is already covered by `npm test` (12 tests); LEAF covers the scene and interactions.
