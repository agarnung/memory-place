import test from "node:test";
import assert from "node:assert/strict";
import { MemoryPlaceCore } from "../Assets/Scripts/MemoryPlaceCore.ts";
import { MEMORY_PLACE_DATA } from "../Assets/Scripts/MemoryPlaceData.ts";

test("dataset has six anchors and six memory cards each", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  assert.equal(core.getAnchors().length, 6);
  for (const anchor of core.getAnchors()) {
    assert.equal(anchor.cards.length, 6);
    assert.equal(anchor.cards[0].prompt.length > 0, true);
    assert.equal(anchor.cards[0].promptEn.length > 0, true);
  }
  assert.equal(core.getProgress().totalCards, 36);
});

test("reset starts idle with no visited cards", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const state = core.getState();
  assert.equal(state.phase, "idle");
  assert.equal(state.visitedCards.length, 0);
  assert.equal(core.getProgress().cardsSeen, 0);
});

test("opening an anchor shows its first memory card", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  assert.equal(core.openAnchor(anchor.id), true);
  assert.equal(core.getState().phase, "card");
  assert.equal(core.getActiveAnchor().id, anchor.id);
  assert.equal(core.getActiveCard().id, anchor.cards[0].id);
  assert.deepEqual(core.getState().visitedCards, [anchor.cards[0].id]);
});

test("next card advances without scoring", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  core.openAnchor(anchor.id);
  assert.equal(core.nextCard(), true);
  assert.equal(core.getActiveCard().id, anchor.cards[1].id);
  assert.equal(core.getProgress().cardsSeen, 2);
  assert.equal(core.getState().phase, "card");
});

test("finishing an anchor returns to idle and marks it visited", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  core.openAnchor(anchor.id);
  for (let index = 0; index < anchor.cards.length - 1; index += 1) {
    assert.equal(core.nextCard(), true);
  }
  assert.equal(core.nextCard(), true);
  assert.equal(core.getState().phase, "idle");
  assert.equal(core.getProgress().anchorsVisited, 1);
  assert.match(core.getState().message, /complete/);
});

test("repeat returns the current card without changing progress", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  core.openAnchor(anchor.id);
  const before = core.getProgress().cardsSeen;
  const card = core.repeatCard();
  assert.equal(card.id, anchor.cards[0].id);
  assert.equal(core.getProgress().cardsSeen, before);
  assert.equal(core.getState().phase, "card");
});

test("a second anchor can be opened after the first", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const [first, second] = core.getAnchors();
  core.openAnchor(first.id);
  for (let index = 0; index < first.cards.length; index += 1) core.nextCard();
  assert.equal(core.openAnchor(second.id), true);
  assert.equal(core.getActiveAnchor().id, second.id);
  assert.equal(core.getProgress().anchorsVisited, 2);
});

test("ending a session stops card navigation", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  core.openAnchor(anchor.id);
  assert.equal(core.endSession(), true);
  assert.equal(core.getState().phase, "session-end");
  assert.equal(core.openAnchor(anchor.id), false);
  assert.equal(core.nextCard(), false);
});

test("caregiver mode toggles on and off", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  assert.equal(core.getState().caregiverMode, false);
  assert.equal(core.toggleCaregiverMode(), true);
  assert.equal(core.getState().caregiverMode, true);
  assert.equal(core.toggleCaregiverMode(), false);
  assert.equal(core.getState().caregiverMode, false);
});

test("unknown anchors and cards are rejected", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  assert.equal(core.openAnchor("missing"), false);
  assert.equal(core.getState().phase, "idle");
  assert.equal(core.getActiveCard(), null);
});

test("reset clears visited cards and session end", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const anchor = core.getAnchors()[0];
  core.openAnchor(anchor.id);
  core.nextCard();
  core.endSession();
  core.reset();
  assert.equal(core.getState().phase, "idle");
  assert.equal(core.getProgress().cardsSeen, 0);
  assert.equal(core.getState().caregiverMode, false);
});

test("progress counts unique cards and anchors", () => {
  const core = new MemoryPlaceCore(MEMORY_PLACE_DATA);
  const [first, second] = core.getAnchors();
  core.openAnchor(first.id);
  core.nextCard();
  core.nextCard();
  core.nextCard();
  core.nextCard();
  core.nextCard();
  core.openAnchor(second.id);
  const progress = core.getProgress();
  assert.equal(progress.cardsSeen, 7);
  assert.equal(progress.anchorsVisited, 2);
  assert.equal(progress.totalAnchors, 6);
  assert.equal(progress.totalCards, 36);
});
