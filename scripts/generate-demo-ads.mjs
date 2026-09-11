/**
 * Generates the demo advertisement artwork in public/ads/.
 *
 * These stand in for real bookings while the banners table is empty, so the
 * rails, strips and footer grid can be laid out and checked at every screen
 * size before a single client has been signed. They are a couple of kilobytes
 * each and are drawn at the exact proportions the site sells — a 2:1 card and
 * an 11:2 strip — so what they prove about the layout is true of real artwork.
 *
 * They are never shown in production; see getAllLiveBanners in lib/queries.ts.
 *
 *   bun scripts/generate-demo-ads.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "ads");
mkdirSync(OUT, { recursive: true });

/** Matches AD_FORMATS in lib/types.ts. */
const CARD = { w: 1200, h: 600 };
const STRIP = { w: 1650, h: 300 };

/** Four schemes, rotated so neighbours in a rail never look alike. */
const SCHEMES = [
  { bg: "#f3efe8", ink: "#150d11", accent: "#8a1332", rule: "#cec4b4" },
  { bg: "#150d11", ink: "#faf8f4", accent: "#e0b29b", rule: "#3d2c33" },
  { bg: "#8a1332", ink: "#fdf1f3", accent: "#e0b29b", rule: "#b0546c" },
  { bg: "#eee4da", ink: "#1e151a", accent: "#8a1332", rule: "#c8b6a4" },
];

/** Invented businesses. Nothing here names a real advertiser. */
const NAMES = [
  ["Sri Balaji Motors", "Servicing & repairs"],
  ["Kandan Grocery", "Fresh every morning"],
  ["Maple Dental Care", "Scarborough & Markham"],
  ["Thamarai Catering", "Weddings & functions"],
  ["Vannan Movers", "Homes and offices"],
  ["Aruna Tailors", "Alterations while you wait"],
  ["Nithya Travels", "Colombo & Chennai fares"],
  ["Ravi Plumbing", "24-hour call-out"],
  ["Selvi Jewellers", "22ct gold"],
  ["Anbu Driving School", "G2 and G road tests"],
  ["Ilango Law Office", "Immigration & family"],
  ["Priya Beauty Salon", "Bridal packages"],
  ["Murugan Sweets", "Made fresh daily"],
  ["Kumar Auto Glass", "Insurance approved"],
  ["Vasanth Electrical", "ESA licensed"],
  ["Nila Daycare", "Licensed home childcare"],
  ["Thendral Printing", "Cards, flyers, banners"],
  ["Bala Accounting", "Personal & corporate tax"],
  ["Sakthi Hardware", "Trade prices"],
  ["Mala Textiles", "Sarees & fabrics"],
  ["Arasu Real Estate", "Buying and selling"],
  ["Devi Pharmacy", "Free local delivery"],
  ["Kavi Photography", "Events & portraits"],
  ["Suriya Roofing", "Free estimates"],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function draw({ w, h, scheme, name, tagline, index, kind }) {
  const s = SCHEMES[scheme % SCHEMES.length];
  const pad = Math.round(h * 0.12);
  const titleSize = kind === "card" ? Math.round(h * 0.13) : Math.round(h * 0.2);
  const tagSize = Math.round(titleSize * 0.42);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(name)}">
  <rect width="${w}" height="${h}" fill="${s.bg}"/>
  <rect x="${pad / 2}" y="${pad / 2}" width="${w - pad}" height="${h - pad}" fill="none" stroke="${s.rule}" stroke-width="${Math.max(2, h * 0.006)}"/>
  <text x="${w / 2}" y="${h * 0.46}" text-anchor="middle" fill="${s.ink}"
        font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700">${esc(name)}</text>
  <text x="${w / 2}" y="${h * 0.46 + tagSize * 1.9}" text-anchor="middle" fill="${s.accent}"
        font-family="Helvetica, Arial, sans-serif" font-size="${tagSize}" letter-spacing="${tagSize * 0.08}">${esc(tagline.toUpperCase())}</text>
  <text x="${w - pad}" y="${h - pad * 0.55}" text-anchor="end" fill="${s.rule}"
        font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.055)}">DEMO ${kind.toUpperCase()} ${String(index).padStart(2, "0")}</text>
</svg>`;
}

let made = 0;

NAMES.forEach(([name, tagline], i) => {
  const index = i + 1;
  writeFileSync(
    join(OUT, `card-${String(index).padStart(2, "0")}.svg`),
    draw({ ...CARD, scheme: i, name, tagline, index, kind: "card" })
  );
  made += 1;
});

for (let i = 0; i < 8; i += 1) {
  const [name, tagline] = NAMES[(i * 3) % NAMES.length];
  const index = i + 1;
  writeFileSync(
    join(OUT, `strip-${String(index).padStart(2, "0")}.svg`),
    draw({ ...STRIP, scheme: i + 1, name, tagline, index, kind: "strip" })
  );
  made += 1;
}

console.log(`Wrote ${made} demo advertisements to public/ads/`);
