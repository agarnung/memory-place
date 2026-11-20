# CLAD build prompt

This is the exact prompt given to the coding agent (CLAD, working through the Lens Studio MCP) to build the first version of the Lens from the planning documents in this folder. The agent created the scene, wired the scripts, installed LEAF, ran the scenarios and reported the results.

The Lens was then refined with further design notes, as the design brief's "fix with design notes, not code" step describes: an English-only interface, larger type and a UI Kit card, 3D placeholders for the places, the card gliding beside the chosen place, the card unfolding in steps, and a session recap. Each change was re-checked with the LEAF scenarios.

```text
Read devpost/design-brief.md, devpost/design-principles.md, devpost/scene-plan.md, devpost/test-plan.md and devpost/memory-place.json.

Build Memory Place for SPECS in this Lens Studio project.

Use the existing scripts in Assets/Scripts and do not rewrite them:
- MemoryPlaceCore.ts (state machine)
- MemoryPlaceData.ts (generated data)
- MemoryPlaceUI.ts (panel and buttons)
- MemoryPlaceMain.ts (anchors and interactions)

Create the scene from devpost/scene-plan.md:
- one root SceneObject with MemoryPlaceMain
- one UI SceneObject with MemoryPlaceUI
- one Anchors SceneObject
- wire MemoryPlaceMain.ui and MemoryPlaceMain.anchorRoot
- use Spectacles Interaction Kit for pinches

Keep the experience failure-free: no score, no timer, no red error state. Use light text for additive display.

The LEAF scenarios are already in Assets/Tests/. Install LEAF from the Asset Library, add Assets/Tests/LeafIndex.ts to a Tests SceneObject, run the scenarios in the LEAF panel, and report which pass. Label criteria without automated tests as "feel unproven".

Do not publish. Do not record or identify people. Save the project when done.
```
