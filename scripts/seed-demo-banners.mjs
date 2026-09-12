/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VAARAM MAGAZINE — SEED THE DEMONSTRATION BANNER BOOKINGS
 *
 *  Fills roughly 60% of the website's advertising slots with demonstration
 *  bookings so the publisher can see a populated site, and deliberately leaves
 *  the remaining 40% empty so the "This space could be your advertisement"
 *  panel can be seen doing its job in the same visit.
 *
 *  It does exactly what the admin dashboard's "Add a banner" form does, in the
 *  same order and against the same two systems:
 *
 *    1. Upload the artwork into object storage  (the form's presigned PUT)
 *    2. Insert one row into ad_banners          (the form's createBanner)
 *
 *  Run:  node scripts/seed-demo-banners.mjs          — book everything
 *        node scripts/seed-demo-banners.mjs --clear  — remove the demo rows
 *
 *  Every row is tagged DEMO_TAG in its target_url query string, so --clear can
 *  find and remove precisely these bookings and nothing the publisher added.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ART = path.join(ROOT, "public", "demo-ads");
const BUCKET = "media";
const DEMO_TAG = "vaaram-demo";

// ── Environment ──────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and a service key must be set in .env.local");
  process.exit(1);
}

const auth = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

/**
 * Where a demonstration click should land.
 *
 * In a real booking this is the advertiser's own website. These are invented
 * businesses with no website to send anyone to, so every demonstration banner
 * points at Vaaram's own contact page instead — a click still opens a new tab
 * and still increments the click counter, which is the behaviour being shown.
 */
const DEMO_TARGET = `https://vaaram-magazine.vercel.app/contact?ref=${DEMO_TAG}`;

// ── The bookings ─────────────────────────────────────────────────────────────
//  FILLED  : site_rail, reader_rail, footer, home_hero, home_mid, listing_top,
//            reader_top          — 7 of the 11 sellable placements (~64%)
//  LEFT OPEN: home_feature, home_closing, listing_inline, reader_below
//            — 4 placements that keep showing the house "book this slot" panel
const BOOKINGS = [
  // ── The side rail. The long column of cards beside the content on the home
  //    page and the archive, and the placement the publisher asked about.
  { art: "card-01-sri-balaji-motors.jpg",   client: "Sri Balaji Motors",        placement: "site_rail", order: 10 },
  { art: "card-02-selvi-jewellers.jpg",     client: "Selvi Jewellers",          placement: "site_rail", order: 20 },
  { art: "card-03-ilango-law.jpg",          client: "Ilango Law",               placement: "site_rail", order: 30 },
  { art: "card-04-thinusha-catering.jpg",   client: "Thinusha Catering",        placement: "site_rail", order: 40 },
  { art: "card-05-apex-mortgages.jpg",      client: "Apex Mortgages",           placement: "site_rail", order: 50 },
  // Carries a stop date, so the Banners list has a scheduled expiry to show.
  { art: "card-06-anbu-driving.jpg",        client: "Anbu Driving School",      placement: "site_rail", order: 60, expires: "2026-12-31" },
  // Saved but switched off. It appears in the dashboard marked Hidden and
  // never reaches the website — the example the manual points at.
  { art: "card-13-silverline-autoglass.jpg", client: "Silverline Auto Glass",   placement: "site_rail", order: 70, active: false },

  // ── Beside the pages of an edition, where readers stay longest.
  { art: "card-07-uthayan-realty.jpg",      client: "Uthayan Realty",           placement: "reader_rail", order: 10 },
  { art: "card-08-maple-dental.jpg",        client: "Maple Leaf Dental",        placement: "reader_rail", order: 20 },

  // ── The wrapping grid above the footer, on every page of the site.
  { art: "card-09-bala-cpa.jpg",            client: "Bala & Associates CPA",    placement: "footer", order: 10 },
  { art: "card-10-quality-movers.jpg",      client: "Quality Movers",           placement: "footer", order: 20 },
  { art: "card-11-nila-grocers.jpg",        client: "Nila Fresh Grocers",       placement: "footer", order: 30 },
  { art: "card-12-kalai-tutoring.jpg",      client: "Kalai Learning Centre",    placement: "footer", order: 40 },

  // ── Wide strips.
  { art: "strip-01-vasantham-supermarket.jpg", client: "Vasantham Supermarket", placement: "home_hero",   order: 10 },
  // Two in one slot, so the rotation and its dots can be seen working.
  { art: "strip-02-northline-insurance.jpg",   client: "Northline Insurance",   placement: "home_mid",    order: 10 },
  { art: "strip-03-tamil-arts-academy.jpg",    client: "Tamil Arts Academy",    placement: "home_mid",    order: 20 },
  { art: "strip-04-harbour-travel.jpg",        client: "Harbour Travel",        placement: "reader_top",  order: 10 },
  { art: "strip-05-lakeview-banquet.jpg",      client: "Lakeview Banquet Hall", placement: "listing_top", order: 10 },
];

// ── Storage ──────────────────────────────────────────────────────────────────

/** The same key shape lib/storage.ts builds: images/<date>-<token>-<slug>.jpg */
function objectKey(fileName) {
  const stamp = new Date().toISOString().slice(0, 10);
  const token = Math.random().toString(36).slice(2, 10);
  const slug = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `images/${stamp}-${token}-${slug}.jpg`;
}

async function ensureBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, { headers: auth });
  if (res.ok) {
    const bucket = await res.json();
    if (!bucket.public) console.warn(`  ! bucket "${BUCKET}" is not public — artwork may not load`);
    return;
  }
  const made = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!made.ok) throw new Error(`Could not create bucket: ${await made.text()}`);
  console.log(`  created public bucket "${BUCKET}"`);
}

async function uploadArtwork(fileName) {
  const file = path.join(ART, fileName);
  if (!existsSync(file)) throw new Error(`Missing artwork: ${file}`);

  const key = objectKey(fileName);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: readFileSync(file),
  });
  if (!res.ok) throw new Error(`Upload failed for ${fileName}: ${await res.text()}`);

  return { key, url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}` };
}

// ── Database ─────────────────────────────────────────────────────────────────
async function insertBanner(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ad_banners`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Insert failed for ${row.client_name}: ${await res.text()}`);
  return (await res.json())[0];
}

async function clearDemo() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ad_banners?target_url=like.*${DEMO_TAG}*&select=id,client_name`,
    { method: "DELETE", headers: { ...auth, Prefer: "return=representation" } }
  );
  const rows = await res.json();
  console.log(`Removed ${Array.isArray(rows) ? rows.length : 0} demonstration bookings.`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes("--clear")) return clearDemo();

  console.log("Checking storage…");
  await ensureBucket();

  console.log(`\nBooking ${BOOKINGS.length} demonstration advertisements…\n`);
  const byPlacement = {};

  for (const b of BOOKINGS) {
    const art = await uploadArtwork(b.art);
    await insertBanner({
      client_name: b.client,
      target_url: DEMO_TARGET,
      image_url: art.url,
      image_key: art.key,
      placement: b.placement,
      edition: null,
      sort_order: b.order,
      is_active: b.active !== false,
      starts_at: null,
      expires_at: b.expires ?? null,
    });
    byPlacement[b.placement] = (byPlacement[b.placement] ?? 0) + 1;
    const flag = b.active === false ? "  (hidden)" : b.expires ? `  (stops ${b.expires})` : "";
    console.log(`  ${b.placement.padEnd(13)} ${b.client}${flag}`);
  }

  const SELLABLE = 11;
  const filled = Object.keys(byPlacement).length;
  console.log(`\n${BOOKINGS.length} bookings across ${filled} of ${SELLABLE} sellable placements ` +
    `(${Math.round((filled / SELLABLE) * 100)}%).`);
  console.log(`Still open, showing the house panel: ${SELLABLE - filled} placements.`);
}

main().catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
