/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VAARAM MAGAZINE — SEED THREE DEMONSTRATION EDITIONS
 *
 *  The archive currently holds exactly one publication (the admin's own
 *  "Testing Advertisement" upload), so the reader page's "More editions"
 *  section — app/(site)/archives/[slug]/page.tsx, the `others.length > 0`
 *  block — has nothing to show and renders nothing at all. This seeds three
 *  more published editions, dated the three Sundays before it, so that
 *  section (and the archive grid, and the home page's "previous editions")
 *  can be seen doing its job.
 *
 *  Each edition reuses public/sample.pdf — the real, laid-out demo PDF this
 *  project already ships for exactly this purpose (see the comment atop
 *  scripts/generate-demo-pdf.mjs) — uploaded as its own object each time, and
 *  one of the pre-generated cover SVGs already committed under public/covers.
 *  Their cover_url is stored as a site-relative path ("/covers/issue-xxx.svg"),
 *  never an absolute origin: the site's CSP only allows images from 'self'
 *  plus object storage, so a hardcoded https://vaaram-magazine.vercel.app URL
 *  would 404 out of the CSP the moment this runs against localhost, a preview
 *  deployment, or the eventual vaaram.ca domain. A relative path resolves
 *  against whichever origin is actually serving the page, which is always
 *  'self'.
 *
 *  It does exactly what the admin's Publish form does: upload the PDF, then
 *  insert one row into `publications`.
 *
 *  Run:  node scripts/seed-demo-editions.mjs          — create the three
 *        node scripts/seed-demo-editions.mjs --clear  — remove exactly them
 *
 *  Created rows are recorded in scripts/.demo-editions.json so --clear can
 *  find and remove precisely these three (and their uploaded PDFs) and
 *  nothing the publisher has added since.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PDF = path.join(ROOT, "public", "sample.pdf");
const MANIFEST = path.join(ROOT, "scripts", ".demo-editions.json");
const BUCKET = "media";

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

// ── The three editions — the three Sundays before the real "Testing
//    Advertisement" edition (2026-09-10) ────────────────────────────────────
const EDITIONS = [
  {
    title: "Back to School — Offers, Property & Jobs",
    date: "2026-09-03",
    cover: "issue-203.svg",
    description:
      "This week: back-to-school offers, new property listings and hiring notices from local employers.",
  },
  {
    title: "Weekend Deals & Local Services",
    date: "2026-08-27",
    cover: "issue-202.svg",
    description:
      "Local services, weekend promotions and community notices from businesses across the GTA.",
  },
  {
    title: "New Listings & Business Directory",
    date: "2026-08-20",
    cover: "issue-201.svg",
    description:
      "New business introductions, property listings and this week's classified notices.",
  },
];

// ── Storage ──────────────────────────────────────────────────────────────────
function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** The same key shape lib/storage.ts builds: editions/<date>-<token>-<slug>.pdf */
function objectKey(fileName) {
  const stamp = new Date().toISOString().slice(0, 10);
  const token = Math.random().toString(36).slice(2, 10);
  const slug = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `editions/${stamp}-${token}-${slug}.pdf`;
}

async function uploadPdf() {
  const bytes = readFileSync(PDF);
  const key = objectKey("sample");
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/pdf", "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) throw new Error(`PDF upload failed: ${await res.text()}`);
  return {
    key,
    url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`,
    size: bytes.length,
  };
}

async function deleteObject(key) {
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`, {
    method: "DELETE",
    headers: auth,
  });
}

// ── Database ─────────────────────────────────────────────────────────────────
async function uniqueSlug(base) {
  let slug = base;
  for (let attempt = 1; attempt < 20; attempt++) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/publications?slug=eq.${encodeURIComponent(slug)}&select=id`,
      { headers: auth }
    );
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return slug;
    slug = `${base}-${attempt + 1}`;
  }
  return slug;
}

async function insertPublication(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/publications`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Insert failed for "${row.title}": ${await res.text()}`);
  return (await res.json())[0];
}

async function deletePublication(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/publications?id=eq.${id}`, {
    method: "DELETE",
    headers: auth,
  });
  return res.ok;
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function clear() {
  if (!existsSync(MANIFEST)) {
    console.log("No demo editions recorded (scripts/.demo-editions.json not found) — nothing to remove.");
    return;
  }
  const created = JSON.parse(readFileSync(MANIFEST, "utf8"));
  for (const entry of created) {
    const ok = await deletePublication(entry.id);
    console.log(ok ? `  removed  ${entry.title}` : `  ! could not remove ${entry.title} (already gone?)`);
    await deleteObject(entry.pdf_key);
  }
  unlinkSync(MANIFEST);
  console.log(`\nRemoved ${created.length} demonstration edition(s).`);
}

async function seed() {
  if (!existsSync(PDF)) {
    throw new Error(`Missing ${PDF} — run: bun add -d pdf-lib && bun scripts/generate-demo-pdf.mjs`);
  }
  if (existsSync(MANIFEST)) {
    throw new Error(
      "scripts/.demo-editions.json already exists — run with --clear first if you want to reseed."
    );
  }

  console.log(`Seeding ${EDITIONS.length} demonstration editions…\n`);
  const created = [];

  for (const ed of EDITIONS) {
    const pdf = await uploadPdf();
    const base = slugify(`${ed.date}-weekly-${ed.title}`);
    const slug = await uniqueSlug(base);

    const row = await insertPublication({
      title: ed.title,
      slug,
      description: ed.description,
      edition: "weekly",
      edition_date: ed.date,
      pdf_url: pdf.url,
      pdf_key: pdf.key,
      file_size_bytes: pdf.size,
      total_pages: 8,
      cover_url: `/covers/${ed.cover}`,
      is_published: true,
    });

    created.push({ id: row.id, title: row.title, pdf_key: pdf.key });
    console.log(`  ${ed.date}  ${ed.title}  ->  /archives/${slug}`);
  }

  writeFileSync(MANIFEST, JSON.stringify(created, null, 2));
  console.log(
    `\n${created.length} demonstration editions created. ` +
      `Run "node scripts/seed-demo-editions.mjs --clear" to remove them again.`
  );
}

(process.argv.includes("--clear") ? clear() : seed()).catch((err) => {
  console.error("\n" + err.message);
  process.exit(1);
});
