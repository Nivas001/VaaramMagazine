/**
 * Generates the demo edition covers in public/covers/.
 *
 * These are real, art-directed covers rather than stock photography: the face
 * of each one is a laid-out grid of advertisement blocks, which is literally
 * what a Vaaram edition contains. They are a few kilobytes each and are meant
 * to be replaced the moment a real cover is uploaded through the admin.
 *
 *   bun scripts/generate-covers.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "covers");
mkdirSync(OUT, { recursive: true });

const W = 896;
const H = 1200;

/** Four cover schemes, rotated so consecutive weeks never look alike. */
const SCHEMES = [
  { name: "ink",   bg: "#141215", type: "#faf8f4", accent: "#d9563e", block: "#221e24", rule: "#3a343c" },
  { name: "paper", bg: "#f3efe8", type: "#141215", accent: "#c2452f", block: "#e3dccf", rule: "#cec4b4" },
  { name: "ember", bg: "#a83722", type: "#fdf3ef", accent: "#f0c9a0", block: "#96301d", rule: "#c2603f" },
  { name: "brass", bg: "#e8e2d8", type: "#1d1a1f", accent: "#9c7430", block: "#d6cdbc", rule: "#c0b49f" },
];

/** Section names that genuinely appear in the publication. */
const SECTIONS = ["Businesses", "Services", "Property", "Jobs", "Offers", "Community"];

/**
 * Deterministic PRNG so a given issue number always produces the same cover —
 * a rebuild must never reshuffle the archive's artwork.
 */
function rng(seed) {
  let s = seed * 2654435761 % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Lays out the advertisement grid that forms the face of the cover. */
function adGrid(rand, scheme) {
  const cols = 4;
  const gap = 12;
  const x0 = 64;
  const y0 = 470;
  const gridW = W - x0 * 2;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = 74;

  const out = [];
  const occupied = new Set();

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < cols; col++) {
      if (occupied.has(`${row}:${col}`)) continue;

      // Occasionally promote a block to a wider or taller display advert.
      const wide = col < cols - 1 && rand() > 0.72 && !occupied.has(`${row}:${col + 1}`);
      const tall = row < 5 && rand() > 0.82;

      const spanX = wide ? 2 : 1;
      const spanY = tall ? 2 : 1;
      for (let r = 0; r < spanY; r++)
        for (let c = 0; c < spanX; c++) occupied.add(`${row + r}:${col + c}`);

      const x = x0 + col * (cellW + gap);
      const y = y0 + row * (cellH + gap);
      const w = cellW * spanX + gap * (spanX - 1);
      const h = cellH * spanY + gap * (spanY - 1);

      const featured = rand() > 0.86;
      const fill = featured ? scheme.accent : scheme.block;
      out.push(`<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="${fill}"/>`);

      // Two or three type lines inside each block, suggesting ad copy.
      const lineColor = featured ? scheme.bg : scheme.rule;
      const lines = spanY > 1 ? 4 : 2;
      for (let i = 0; i < lines; i++) {
        const lw = w * (0.42 + rand() * 0.44);
        out.push(
          `<rect x="${(x + 12).toFixed(1)}" y="${y + 16 + i * 14}" width="${lw.toFixed(1)}" height="${i === 0 ? 7 : 4}" rx="2" fill="${lineColor}" opacity="${i === 0 ? 0.95 : 0.5}"/>`
        );
      }
    }
  }
  return out.join("");
}

function cover({ issue, dateLabel, scheme }) {
  const rand = rng(issue);
  const s = SCHEMES[scheme % SCHEMES.length];
  const strap = SECTIONS.join("  ·  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Vaaram Magazine issue ${issue} cover">
  <rect width="${W}" height="${H}" fill="${s.bg}"/>

  <!-- Masthead -->
  <text x="64" y="196" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="500" letter-spacing="-6" fill="${s.type}">Vaaram</text>
  <rect x="64" y="228" width="${W - 128}" height="2" fill="${s.accent}"/>

  <!-- Standfirst -->
  <text x="64" y="268" font-family="Helvetica, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="4.2" fill="${s.accent}">WEEKLY ADVERTISING MAGAZINE</text>
  <text x="64" y="300" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="1.2" fill="${s.type}" opacity="0.72">Discover. Connect. Every week.</text>

  <!-- Issue plate -->
  <text x="${W - 64}" y="196" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3" fill="${s.type}" opacity="0.6">ISSUE</text>
  <text x="${W - 64}" y="268" text-anchor="end" font-family="Georgia, serif" font-size="76" font-weight="500" fill="${s.accent}">${issue}</text>
  <text x="${W - 64}" y="300" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="15" letter-spacing="0.6" fill="${s.type}" opacity="0.72">${dateLabel}</text>

  <!-- Cover line -->
  <text x="64" y="392" font-family="Georgia, serif" font-size="46" font-weight="500" letter-spacing="-1.2" fill="${s.type}">Everything local,</text>
  <text x="64" y="440" font-family="Georgia, serif" font-size="46" font-weight="500" letter-spacing="-1.2" fill="${s.accent}">in one edition.</text>

  <!-- The advertisement grid: the actual content of the magazine -->
  ${adGrid(rand, s)}

  <!-- Footer strap -->
  <rect x="64" y="${H - 92}" width="${W - 128}" height="1" fill="${s.rule}"/>
  <text x="64" y="${H - 58}" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.6" fill="${s.type}" opacity="0.82">${strap}</text>
  <text x="${W - 64}" y="${H - 58}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.6" fill="${s.accent}">vaaram.ca</text>
</svg>`;
}

/* ── Generate one cover per demo edition ─────────────────────────────────── */
const START_ISSUE = 204;
const START_DATE = Date.UTC(2026, 8, 6); // Sunday 6 September 2026
const WEEKS = 18;

const manifest = [];
for (let i = 0; i < WEEKS; i++) {
  const issue = START_ISSUE - i;
  const date = new Date(START_DATE - i * 7 * 86400000);
  const iso = date.toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat("en-CA", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(date);

  const svg = cover({ issue, dateLabel, scheme: i });
  writeFileSync(join(OUT, `issue-${issue}.svg`), svg);
  manifest.push({ issue, iso, dateLabel });
}

console.log(`Generated ${manifest.length} covers in public/covers/`);
console.log(JSON.stringify(manifest, null, 0));
