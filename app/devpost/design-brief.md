---
status: approved
---

# Design brief: Memory Place

## The one spatial moment

An older adult stands with a caregiver in the centre of a 2.6 m ring of six familiar places. They walk to one place, pinch it, and a single memory card appears in front of them: one open question, one sensory cue, and a large Repeat button. The caregiver can open a follow-up prompt. There is no score, no timer, and no wrong answer.

## Why it belongs on glasses

- Uses: draws in the world, leaves your body free, and shares your view when the caregiver looks at the same card.
- Why it's better than the phone or laptop version: the familiar place is the cue, and the person can keep both hands free while talking. A flat app would turn a shared reminiscence moment into another screen between two people.

## Product or overlay

- Type: product. The virtual places and memory cards are the experience.
- What the real version would sense: nothing. The content is virtual and the room is the user's own space.
- Stand-in for the preview: none needed.

## Where things live

- Where the user is looking during the main task: forward and slightly down, then left or right while walking the ring.
- Memory ring: 2.6 m radius around the starting point, marked by a thin path on the floor.
- Places: six 3D objects, 22 cm tall, at 1.15 m height, at -60°, -36°, -12°, 12°, 36° and 60° on the ring.
- Place labels: large labels (6 cm letters) 25 cm above each place, turned to face the centre of the ring.
- Memory card: 45 x 30 cm, anchored 25 cm in front of the active place at 1.0 m height.
- Prompt: English, 4.4 cm letter height at 1.5 m (Atkinson Hyperlegible). The dataset keeps a Spanish version of every field for a future language switch.
- Sensory cue: 18 pt, warm colour, directly below the prompt.
- Caregiver note: 13 pt, only visible in caregiver mode.
- Buttons: Repeat, Next, Home, Caregiver and End, at least 22 cm wide, below the card.

## Hands and input

- Place: pinch to open its first memory.
- Repeat: pinch the large Repeat button.
- Next: pinch the large Next button.
- Home: pinch the Home button to return to the welcome state.
- Caregiver: pinch the Caregiver button to show or hide the follow-up prompt.
- End: pinch the End button to close the session with a thank-you screen.
- Targets are at least 22 cm and highlight when aimed at.
- Voice: none. Every action has a pinch equivalent.

## When things show

- Ring and places: visible from the start; places stay put.
- Memory card: appears only when a place is pinched; one card at a time.
- Caregiver note: only in caregiver mode.
- Buttons: Repeat and Next appear with a card; Home, Caregiver and End stay visible.
- Session end: only when the caregiver presses End; no automatic failure.
- If the user looks away, the card stays anchored; no chasing or flashing.

## Done criteria

1. The preview shows six places on a 2.6 m ring, each with a large label.
2. Pinching a place opens one memory card with a prompt and a sensory cue.
3. Pinching Repeat shows the same card again without changing progress.
4. Pinching Next advances to the next memory in the same place.
5. Finishing the six memories returns to the welcome state and marks the place with a check.
6. Pinching Caregiver shows the follow-up prompt and a short caregiver note.
7. Pinching Home resets the session; pinching End shows a thank-you screen with no score.
8. The whole flow works in Lens Studio preview with mouse-as-pinch, without SPECS glasses.

## Out of scope

- Diagnosis, treatment, medical advice or clinical claims.
- Recording, identifying or following people.
- Real photos, names, addresses or personal data in the demo.
- Voice input, live camera recognition, hand tracking and multiplayer.
- More than six places and 36 memories in the first build.
- Persistence between sessions.

## Risks and open questions

- Reading long prompts on glasses is tiring; prompts are capped at 160 characters and the caregiver can read them aloud.
- Six places around the user may encourage turning rather than walking; the 2.6 m ring requires a few steps, and comfort is unproven.
- Colour-only distinctions fail for colour-blind users; every place also has a distinct shape and a text label.
- Additive display: dark text disappears; use light text and bright place markers.
- The content is sensitive; it is fictional and must be replaced by the caregiver's own memories outside the demo.
- This is a support tool, not a medical device; the brief and video must say so.

## Build notes for CLAD

- The TypeScript is already written: `Assets/Scripts/MemoryPlaceCore.ts` (state machine), `MemoryPlaceData.ts` (generated from `devpost/memory-place.json`), `MemoryPlaceUI.ts` (panel and buttons), and `MemoryPlaceMain.ts` (places and interactions).
- Follow `devpost/scene-plan.md` for the exact hierarchy and `@input` wiring. Do not rewrite the scripts unless the build requires it.
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) for the places, Repeat, Next, Home, Caregiver and End, so they work with the mouse in Interactive Preview and with LEAF.
- Load `devpost/memory-place.json`; it contains six places and six memory cards per place.
- Keep the experience failure-free: no red error states, no score, no timer, no countdown.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it

This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch.
3. **Ask the accessibility questions.**
   - Can someone read the prompt without leaning in?
   - Is there one task on screen, not a dashboard?
   - Can the caregiver follow without taking over?
   - Is there any red error state, timer or score that creates pressure?
4. **Check comfort.**
   - Everything needed is in view while the person talks. Nothing sits at the edges or behind them.
   - Every button is within reach of someone standing there.
   - Text reads easily from where they stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you.
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the card 15 cm lower and make the Repeat button twice as big. Re-run the tests."
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: <https://learn-specs.devpost.com/resources>
