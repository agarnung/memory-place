import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, "../devpost/memory-place.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const shapes = new Set(["house", "heart", "note", "toolbox", "leaf", "suitcase"]);
const errors = [];

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isVector3(value) {
  return Array.isArray(value) && value.length === 3 && value.every(isNumber);
}

function checkText(where, field, max) {
  if (typeof field !== "string" || field.length === 0) {
    errors.push(`${where}: missing text`);
    return;
  }
  if (field.length > max) {
    errors.push(`${where}: too long for glasses (${field.length} > ${max})`);
  }
}

if (data.version !== 1) errors.push("version: expected 1");
if (data.unit !== "meters") errors.push("unit: expected meters");
checkText("title", data.title, 40);
checkText("audience", data.audience, 160);
checkText("safety", data.safety, 200);

if (!Array.isArray(data.anchors) || data.anchors.length !== 6) {
  errors.push("anchors: expected 6");
}

const anchorIds = new Set();
const cardIds = new Set();

for (const anchor of data.anchors ?? []) {
  const id = anchor?.id;
  if (typeof id !== "string" || id.length === 0) {
    errors.push("anchor: missing id");
    continue;
  }
  if (anchorIds.has(id)) errors.push(`${id}: duplicate anchor id`);
  anchorIds.add(id);

  checkText(`${id}.name`, anchor.name, 30);
  checkText(`${id}.nameEs`, anchor.nameEs, 30);
  checkText(`${id}.concept`, anchor.concept, 50);

  if (!shapes.has(anchor.shape)) errors.push(`${id}: unknown shape ${JSON.stringify(anchor.shape)}`);
  if (typeof anchor.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(anchor.color)) {
    errors.push(`${id}: color must be #RRGGBB`);
  }
  if (!isVector3(anchor.position)) {
    errors.push(`${id}: position must be [x, y, z]`);
  } else {
    const [x, y, z] = anchor.position;
    if (Math.abs(x) > 2.5 || y < 0.4 || y > 2.0 || z > -0.4 || z < -3.0) {
      errors.push(`${id}: position outside the room envelope`);
    }
  }

  if (!Array.isArray(anchor.cards) || anchor.cards.length !== 6) {
    errors.push(`${id}: expected 6 memory cards`);
    continue;
  }

  for (const card of anchor.cards) {
    const cardId = card?.id;
    if (typeof cardId !== "string" || cardId.length === 0) {
      errors.push(`${id}: card missing id`);
      continue;
    }
    if (cardIds.has(cardId)) errors.push(`${cardId}: duplicate card id`);
    cardIds.add(cardId);

    for (const field of ["title", "titleEs", "prompt", "promptEn", "sensoryCue", "sensoryCueEn", "followUp", "followUpEn"]) {
      checkText(`${cardId}.${field}`, card[field], field.startsWith("title") ? 50 : field.startsWith("prompt") ? 160 : field.startsWith("sensory") ? 100 : 120);
    }

    if (!["early", "mid"].includes(card.stage)) {
      errors.push(`${cardId}: stage must be early or mid`);
    }
    if (!["home", "family", "music", "work", "garden", "travel"].includes(card.domain)) {
      errors.push(`${cardId}: unknown domain ${JSON.stringify(card.domain)}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Invalid Memory Place dataset (${errors.length} errors):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Valid Memory Place dataset: ${data.anchors.length} anchors, ${data.anchors.length * 6} memory cards.`);
