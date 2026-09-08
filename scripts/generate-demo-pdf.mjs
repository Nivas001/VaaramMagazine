/**
 * Builds public/sample.pdf — the demo edition the reader opens in development.
 *
 * It is a real, multi-page PDF laid out the way a Vaaram edition is: a cover,
 * then section pages of advertisements at the five sizes actually sold. That
 * makes the reader worth demonstrating, and it is replaced the moment a real
 * edition is uploaded through the admin.
 *
 * pdf-lib is not a project dependency: it pins tslib to 1.x, which breaks the
 * 3D scene's camera-controls. Install it only for the moment you regenerate:
 *
 *   bun add -d pdf-lib && bun scripts/generate-demo-pdf.mjs && bun remove pdf-lib
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sample.pdf");

// A4 at 72dpi.
const W = 595;
const H = 842;
const M = 42;

const INK = rgb(0.078, 0.071, 0.082);
const PAPER = rgb(0.953, 0.937, 0.91);
const WHITE = rgb(1, 1, 1);
const EMBER = rgb(0.761, 0.271, 0.184);
const BRASS = rgb(0.612, 0.455, 0.188);
const RULE = rgb(0.83, 0.8, 0.75);
const MUTED = rgb(0.55, 0.52, 0.48);

const SECTIONS = [
  { name: "Businesses", blurb: "Shops, trades and local firms" },
  { name: "Services", blurb: "Professionals, repairs and everyday help" },
  { name: "Property", blurb: "Homes and commercial space" },
  { name: "Jobs", blurb: "Vacancies from local employers" },
  { name: "Offers", blurb: "This week's promotions" },
  { name: "Community", blurb: "Events, classes and notices" },
];

const ISSUE = 204;
const DATE = "September 6, 2026";

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const doc = await PDFDocument.create();
doc.setTitle(`Vaaram Magazine — Issue ${ISSUE}`);
doc.setSubject("Weekly advertising magazine");
doc.setCreator("Vaaram Magazine");

const serif = await doc.embedFont(StandardFonts.TimesRoman);
const sans = await doc.embedFont(StandardFonts.Helvetica);
const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

/** Letter-spaced small caps, used for every label. */
function label(page, text, x, y, size, color) {
  let cursor = x;
  for (const ch of text.toUpperCase()) {
    page.drawText(ch, { x: cursor, y, size, font: sansBold, color });
    cursor += sansBold.widthOfTextAtSize(ch, size) + size * 0.16;
  }
}

/* ── Cover ────────────────────────────────────────────────────────────────── */
{
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: INK });

  page.drawText("Vaaram", { x: M, y: H - 130, size: 82, font: serif, color: WHITE });
  page.drawRectangle({ x: M, y: H - 148, width: W - M * 2, height: 1.4, color: EMBER });

  label(page, "Weekly advertising magazine", M, H - 170, 8.5, EMBER);
  page.drawText("Discover. Connect. Every week.", {
    x: M, y: H - 190, size: 10, font: sans, color: rgb(0.72, 0.7, 0.67),
  });

  label(page, "Issue", W - M - 34, H - 130, 8, rgb(0.6, 0.58, 0.55));
  page.drawText(String(ISSUE), {
    x: W - M - serif.widthOfTextAtSize(String(ISSUE), 40), y: H - 172, size: 40, font: serif, color: EMBER,
  });
  page.drawText(DATE, {
    x: W - M - sans.widthOfTextAtSize(DATE, 9), y: H - 190, size: 9, font: sans, color: rgb(0.72, 0.7, 0.67),
  });

  page.drawText("Everything local,", { x: M, y: H - 250, size: 30, font: serif, color: WHITE });
  page.drawText("in one edition.", { x: M, y: H - 286, size: 30, font: serif, color: EMBER });

  // The advertisement grid that makes up the face of the cover.
  const rand = rng(ISSUE);
  const cols = 4;
  const gap = 9;
  const gridW = W - M * 2;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = 62;
  const top = H - 320;
  const taken = new Set();

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < cols; col++) {
      if (taken.has(`${row}:${col}`)) continue;
      const wide = col < cols - 1 && rand() > 0.72 && !taken.has(`${row}:${col + 1}`);
      const tall = row < 5 && rand() > 0.82;
      const sx = wide ? 2 : 1;
      const sy = tall ? 2 : 1;
      for (let r = 0; r < sy; r++) for (let c = 0; c < sx; c++) taken.add(`${row + r}:${col + c}`);

      const x = M + col * (cellW + gap);
      const h = cellH * sy + gap * (sy - 1);
      const y = top - row * (cellH + gap) - h;
      const w = cellW * sx + gap * (sx - 1);
      const featured = rand() > 0.86;

      page.drawRectangle({
        x, y, width: w, height: h,
        color: featured ? EMBER : rgb(0.133, 0.118, 0.141),
      });
      const lineColor = featured ? INK : rgb(0.23, 0.21, 0.24);
      const lines = sy > 1 ? 4 : 2;
      for (let i = 0; i < lines; i++) {
        page.drawRectangle({
          x: x + 9, y: y + h - 16 - i * 11,
          width: (w - 18) * (0.42 + rand() * 0.44),
          height: i === 0 ? 5 : 3,
          color: lineColor,
        });
      }
    }
  }

  page.drawRectangle({ x: M, y: 58, width: W - M * 2, height: 0.7, color: rgb(0.23, 0.21, 0.24) });
  label(page, SECTIONS.map((s) => s.name).join("  ·  "), M, 40, 7.5, rgb(0.72, 0.7, 0.67));
  label(page, "vaaram.ca", W - M - 46, 40, 7.5, EMBER);
}

/* ── Section pages ────────────────────────────────────────────────────────── */
SECTIONS.forEach((section, index) => {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });

  // Running head
  page.drawText("Vaaram", { x: M, y: H - 52, size: 17, font: serif, color: INK });
  label(page, section.name, W - M - 90, H - 48, 8, EMBER);
  page.drawRectangle({ x: M, y: H - 62, width: W - M * 2, height: 0.7, color: RULE });

  page.drawText(section.name, { x: M, y: H - 100, size: 26, font: serif, color: INK });
  page.drawText(section.blurb, { x: M, y: H - 118, size: 9.5, font: sans, color: MUTED });

  // The page's advertisements, at the sizes actually sold.
  const rand = rng((index + 3) * 97);
  const gridTop = H - 142;
  const gridBottom = 74;
  const gridH = gridTop - gridBottom;
  const cols = 4;
  const gap = 10;
  const cellW = (W - M * 2 - gap * (cols - 1)) / cols;
  const rows = 6;
  const cellH = (gridH - gap * (rows - 1)) / rows;
  const taken = new Set();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (taken.has(`${row}:${col}`)) continue;

      // A single display advert per page gets the prime block.
      const isHero = row === 0 && col === 0 && index % 2 === 0;
      const sx = isHero ? 2 : rand() > 0.7 && col < cols - 1 && !taken.has(`${row}:${col + 1}`) ? 2 : 1;
      const sy = isHero ? 2 : rand() > 0.78 && row < rows - 1 ? 2 : 1;

      let fits = true;
      for (let r = 0; r < sy; r++)
        for (let c = 0; c < sx; c++)
          if (row + r >= rows || col + c >= cols || taken.has(`${row + r}:${col + c}`)) fits = false;
      const spanX = fits ? sx : 1;
      const spanY = fits ? sy : 1;
      for (let r = 0; r < spanY; r++)
        for (let c = 0; c < spanX; c++) taken.add(`${row + r}:${col + c}`);

      const x = M + col * (cellW + gap);
      const h = cellH * spanY + gap * (spanY - 1);
      const y = gridTop - row * (cellH + gap) - h;
      const w = cellW * spanX + gap * (spanX - 1);

      const featured = isHero || rand() > 0.88;
      page.drawRectangle({
        x, y, width: w, height: h,
        color: featured ? EMBER : WHITE,
        borderColor: featured ? EMBER : RULE,
        borderWidth: 0.7,
      });

      const type = featured ? WHITE : INK;
      const soft = featured ? rgb(1, 0.86, 0.82) : MUTED;

      label(page, section.name, x + 9, y + h - 16, 5.5, featured ? WHITE : BRASS);
      // Headline rules
      const headlines = spanY > 1 ? 2 : 1;
      for (let i = 0; i < headlines; i++) {
        page.drawRectangle({
          x: x + 9, y: y + h - 30 - i * 10,
          width: (w - 18) * (0.55 + rand() * 0.4), height: 5.5, color: type,
        });
      }
      // Body rules
      const body = spanY > 1 ? 6 : 2;
      for (let i = 0; i < body; i++) {
        page.drawRectangle({
          x: x + 9, y: y + h - 46 - headlines * 10 - i * 8,
          width: (w - 18) * (0.45 + rand() * 0.5), height: 2.4, color: soft,
        });
      }
      // Contact strip — every advert ends with a way to get in touch.
      page.drawRectangle({
        x: x + 9, y: y + 9, width: Math.min(52, w - 18), height: 9,
        color: featured ? WHITE : EMBER,
      });
    }
  }

  // Folio
  page.drawRectangle({ x: M, y: 58, width: W - M * 2, height: 0.7, color: RULE });
  label(page, `Issue ${ISSUE} · ${DATE}`, M, 40, 7, MUTED);
  page.drawText(String(index + 2), {
    x: W - M - sans.widthOfTextAtSize(String(index + 2), 9), y: 40, size: 9, font: sans, color: MUTED,
  });
});

/* ── Back page: how to advertise ──────────────────────────────────────────── */
{
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: INK });

  page.drawText("Advertise in", { x: M, y: H - 210, size: 34, font: serif, color: WHITE });
  page.drawText("next week's edition.", { x: M, y: H - 250, size: 34, font: serif, color: EMBER });

  const lines = [
    "Tell us what you would like to advertise.",
    "We lay it out and send you a proof to approve.",
    "It runs in the next edition, online the same week.",
  ];
  lines.forEach((line, i) => {
    page.drawText(line, { x: M, y: H - 300 - i * 20, size: 11, font: sans, color: rgb(0.72, 0.7, 0.67) });
  });

  page.drawRectangle({ x: M, y: H - 400, width: W - M * 2, height: 0.7, color: rgb(0.23, 0.21, 0.24) });
  label(page, "Five sizes, from a classified line to a full page", M, H - 420, 8, BRASS);

  label(page, "vaaram.ca", M, 60, 9, EMBER);
}

const bytes = await doc.save();
writeFileSync(OUT, bytes);
console.log(`Wrote ${OUT} — ${doc.getPageCount()} pages, ${(bytes.length / 1024).toFixed(0)} KB`);
