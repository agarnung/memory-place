import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../devpost/memory-place.json");
const target = resolve(here, "../devpost/memory-place-preview.html");
const data = JSON.parse(readFileSync(source, "utf8"));

const width = 900;
const height = 620;
const centerX = width / 2;
const centerY = 330;
const meters = 110;

function mapPoint(position) {
  return [centerX + position[0] * meters, centerY + position[2] * meters];
}

function anchorMarkup(anchor, index) {
  const [x, y] = mapPoint(anchor.position);
  return `
    <g class="anchor">
      <circle cx="${x}" cy="${y}" r="26" fill="${anchor.color}" fill-opacity="0.16" stroke="${anchor.color}" stroke-width="2" />
      <circle cx="${x}" cy="${y}" r="9" fill="${anchor.color}" />
      <text x="${x}" y="${y + 4}" class="number">${index + 1}</text>
      <text x="${x}" y="${y - 30}" class="anchor-label">${anchor.name}</text>
    </g>
  `;
}

function cardMarkup(card) {
  return `
    <li>
      <h3>${card.title}</h3>
      <p class="prompt">${card.prompt}</p>
      <p class="prompt-en">${card.promptEn}</p>
      <p class="cue">${card.sensoryCue}</p>
      <details>
        <summary>Follow-up and caregiver note</summary>
        <p>${card.followUp}</p>
        <p>${card.followUpEn}</p>
      </details>
    </li>
  `;
}

function anchorCardMarkup(anchor, index) {
  return `
    <article class="card" style="--accent: ${anchor.color}">
      <header>
        <span class="index">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <h2>${anchor.name} <span>${anchor.nameEs}</span></h2>
          <p>${anchor.concept}</p>
        </div>
        <span class="shape">${anchor.shape}</span>
      </header>
      <ol>${anchor.cards.map(cardMarkup).join("")}</ol>
    </article>
  `;
}

const pathPoints = data.anchors
  .map((anchor) => {
    const [x, y] = mapPoint(anchor.position);
    return `${x},${y}`;
  })
  .join(" ");

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Memory Place — spatial preview</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background: #07080B;
      color: #F3F5F9;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -0.03em; }
    .intro { margin: 0 0 8px; color: #9AA4B8; font-size: 14px; max-width: 760px; }
    .safety { margin: 0 0 24px; color: #FFD166; font-size: 13px; max-width: 760px; }
    .map { margin-bottom: 24px; padding: 12px; border: 1px solid #252A36; border-radius: 20px; background: #10131A; }
    svg { display: block; width: 100%; height: auto; }
    .grid-line { stroke: #1C2230; stroke-width: 1; }
    .path { fill: none; stroke: #FFD166; stroke-width: 2; stroke-dasharray: 5 8; opacity: 0.7; }
    .anchor-label { fill: #C8D0DE; font: 600 12px ui-monospace, monospace; text-anchor: middle; }
    .number { fill: #07080B; font: 700 10px ui-monospace, monospace; text-anchor: middle; }
    .axis { fill: #5F6B82; font: 500 10px ui-monospace, monospace; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }
    .card { padding: 16px; border: 1px solid #252A36; border-left: 3px solid var(--accent); border-radius: 16px; background: #10131A; }
    .card header { display: flex; align-items: center; gap: 12px; }
    .card h2 { margin: 0; font-size: 17px; }
    .card h2 span { color: #9AA4B8; font-size: 13px; font-weight: 500; }
    .card header p { margin: 2px 0 0; color: #9AA4B8; font-size: 12px; }
    .index { color: var(--accent); font: 700 12px ui-monospace, monospace; }
    .shape { margin-left: auto; color: var(--accent); font: 600 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.08em; }
    ol { margin: 12px 0 0; padding-left: 18px; }
    li { margin: 12px 0; }
    h3 { margin: 0; font-size: 14px; }
    .prompt { margin: 4px 0 0; font-size: 14px; line-height: 1.45; }
    .prompt-en { margin: 2px 0 0; color: #9AA4B8; font-size: 12px; line-height: 1.4; }
    .cue { margin: 4px 0 0; color: #FFD166; font-size: 12px; }
    details { margin-top: 6px; color: #C8D0DE; font-size: 12px; }
    summary { cursor: pointer; color: #7F8AA3; }
    details p { margin: 6px 0; }
  </style>
</head>
<body>
  <h1>Memory Place — spatial preview</h1>
  <p class="intro">A gentle reminiscence space for older adults living with mild cognitive impairment or Alzheimer's, used with a caregiver. One familiar place at a time; no scoring, no timers, no failure states.</p>
  <p class="safety">${data.safety}</p>
  <section class="map">
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Top-down map of six familiar places">
      <rect width="${width}" height="${height}" fill="#0B0D12" />
      ${Array.from({ length: 11 }, (_, i) => `<line x1="${60 + i * 78}" y1="40" x2="${60 + i * 78}" y2="${height - 40}" class="grid-line" />`).join("")}
      ${Array.from({ length: 8 }, (_, i) => `<line x1="40" y1="${40 + i * 72}" x2="${width - 40}" y2="${40 + i * 72}" class="grid-line" />`).join("")}
      <circle cx="${centerX}" cy="${centerY}" r="${2.6 * meters}" fill="none" stroke="#252A36" stroke-width="1.5" />
      <circle cx="${centerX}" cy="${centerY}" r="14" fill="#F3F5F9" fill-opacity="0.9" />
      <text x="${centerX}" y="${centerY + 34}" class="axis">YOU</text>
      <polyline points="${pathPoints}" class="path" />
      ${data.anchors.map(anchorMarkup).join("")}
      <text x="${centerX}" y="${height - 18}" class="axis">2.6 m memory ring · choose a familiar place · pinch to open</text>
    </svg>
  </section>
  <main class="cards">
    ${data.anchors.map(anchorCardMarkup).join("")}
  </main>
</body>
</html>
`;

writeFileSync(target, html);
console.log(`Rendered ${data.anchors.length} anchors to ${target}`);
