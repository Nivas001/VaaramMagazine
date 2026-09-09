# Vaaram Magazine — weekly advertising publication

A production-ready website for publishing a weekly advertising and classifieds
magazine as a downloadable PDF, with a reader, a full archive, sponsored banner
slots and an admin dashboard for the publisher.

**Read [`SETUP-GUIDE.pdf`](./SETUP-GUIDE.pdf) first** — it walks through every
account you need to create and every value that goes in `.env.local`.

## What it does

| For readers | For the publisher (admin) |
| --- | --- |
| Read any edition in a built-in PDF reader — zoom, rotate, swipe, full screen | Upload the weekly PDF by drag and drop |
| Download the original print-quality PDF | Cover thumbnail + page count generated automatically |
| Browse the archive as a grid, a list or a calendar | Publish now or save as a draft |
| Ask to be emailed when a new edition goes live | Own the reader list, copy it to a mail tool |
| Send an enquiry to place an advertisement | Read every enquiry, mark it contacted or closed |
| Light and dark mode | Add sponsored banners with view/click stats |

## Tech

- **Next.js 15** (App Router) + TypeScript + **Tailwind CSS v4**
- **Supabase** — Postgres database, admin authentication, Row Level Security
- **Cloudflare R2** — optional. PDF and image storage with no charge for
  downloads; the site falls back to **Supabase Storage** automatically when the
  R2 variables are absent, so it runs fully without an R2 account
- **pdf.js** — the reader, running entirely in the visitor's browser
- **Motion** — scroll animations
- **react-three-fiber** — the two 3D scenes on the About page

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>. The admin dashboard is at `/admin`.

Run `supabase/schema.sql` once in the Supabase SQL editor before first use, and
again after any update that adds a table — Admin → Settings tells you when a
table is missing.

## Layout

```
app/
  (site)/        Public pages: home, archives, edition reader, about, contact, legal
  admin/         Publishing dashboard, behind an emailed sign-in code
  api/           Upload tickets, contact form, subscribe, view/click counters
  icon.svg       Favicon, generated from the brand mark
  manifest.ts    Web app manifest
  opengraph-image.tsx  The social share card, drawn from the brand tokens
components/
  ads/           Banner slots, rotation, the house "advertise here" panel
  home/          Hero, what-it-is, how-it-works, stats, advertise, subscribe
  magazine/      Cover artwork, edition cards, the latest-edition block
  archive/       Grid / list / calendar browser
  reader/        The pdf.js reader
  site/          Navbar, footer, logo lockup, mark, forms, FAQ, theme
  ui/            Section rhythm, reveal animation, illustration set
lib/             Supabase clients, storage, queries, rate limiting, helpers
scripts/
  generate-logo.py     Regenerates the brand mark and its React component
  generate-covers.mjs  Demo cover artwork
supabase/        schema.sql — run this in the Supabase SQL editor
site.config.ts   Brand name, copy, contact details, ticker, categories, FAQ
```

## Re-branding

Almost everything visible is in **`site.config.ts`** — the name, tagline, phone
number, address, ticker messages, categories and FAQ. Change it there and the
whole site updates.

Colours live in the `@theme` block at the top of `app/globals.css`: `wine` is
the maroon of the logotype, `gold` is its rose gold, and `--accent` / `--label`
/ `--mark-*` map those onto light and dark.

The bird mark is generated — edit `scripts/generate-logo.py` and re-run it:

```bash
python3 scripts/generate-logo.py
```

That rewrites both `public/brand/vaaram-mark.svg` (used for the favicon and the
share card) and `components/site/VaaramMark.tsx` (used everywhere in the UI).
To drop in a different mark instead, replace the artwork in both files.
