import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../devpost/memory-place.json");
const target = resolve(here, "../Assets/Scripts/MemoryPlaceData.ts");
const data = JSON.parse(readFileSync(source, "utf8"));

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `import type { MemoryPlaceData } from "./MemoryPlaceCore";\n\n` +
    `export const MEMORY_PLACE_DATA: MemoryPlaceData = ${JSON.stringify(data, null, 2)};\n`,
);
console.log(`Wrote ${data.anchors.length} anchors to ${target}`);
