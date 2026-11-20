# LEAF test plan — Memory Place

Each criterion is checked in Lens Studio's Interactive Preview. The mouse acts as a pinch.

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Places visible | Open the Lens; look around from the centre | Six places on the 2.6 m ring, each with a large label |
| 2 | Open a memory | Pinch a place | One card appears with a prompt and a sensory cue |
| 3 | Repeat | Pinch Repeat | The same card stays; progress does not change |
| 4 | Next | Pinch Next | The next memory appears in the same place |
| 5 | Finish a place | Pinch Next through all six memories | Welcome state returns; the place gets a check |
| 6 | Caregiver mode | Pinch Caregiver | Follow-up prompt and caregiver note appear; pinch again to hide |
| 7 | Home | Pinch Home | Welcome state returns and progress resets |
| 8 | End session | Pinch End | Thank-you screen; no score or failure |
| 9 | Spatial anchor | Walk around the ring | Places keep position and scale |
| 10 | Accessibility | Read from 1.5–2.5 m | Prompt is readable; buttons are large and separated |

## Notes

- Tests 1, 5, 8, 9 and 10 may require visual inspection in addition to LEAF.
- Tests 2, 3, 4, 6, 7 and 8 should be covered by LEAF using pinch on SIK.
- Criteria without an automated test: legibility, comfort and scale. Label them "feel unproven".
- There must be no red error state, score, timer or countdown in any test.

## Core tests already runnable

```bash
npm test
```

Covers 12 cases of `MemoryPlaceCore`: dataset, opening a place, first card, next card, repeat, finishing a place, second place, end session, caregiver toggle, invalid anchor, reset and progress.
