# AdExpress — Weekly Classifieds Website

A zero-cost, SEO-ready website for publishing a weekly classified ads paper as a
downloadable PDF, with an admin dashboard for the publisher and sponsored banner
slots throughout the site.

**Read [`SETUP-GUIDE.pdf`](./SETUP-GUIDE.pdf) first** — it walks through every
account you need to create and every value that goes in `.env.local`.

## What it does

| For readers | For the publisher (admin) |
| --- | --- |
| Read any issue in a built-in PDF reader — zoom, rotate, swipe, full screen | Upload the weekly PDF by drag and drop |
| Download the original print-quality PDF | Cover thumbnail + page count generated automatically |
| Browse the full archive, filtered by edition | Publish now or save as a draft |
| Send an enquiry to place an ad | Read every enquiry, mark it contacted or closed |
| Light and dark mode | Add sponsored banners with view/click stats |

## Tech

- **Next.js 15** (App Router) + TypeScript + **Tailwind CSS v4**
- **Supabase** — Postgres database, admin authentication, Row Level Security
- **Cloudflare R2** — PDF and image storage with no charge for downloads
  (falls back to Supabase Storage automatically if R2 is not configured)
- **pdf.js** — the reader, running entirely in the visitor's browser
- **Motion** — scroll animations

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>. The admin dashboard is at `/admin`.

## Layout

```
app/
  (site)/        Public pages: home, archives, about, contact, legal
  admin/         Publishing dashboard, behind an emailed sign-in code
  api/           Upload tickets, contact form, view/click counters
components/      UI primitives, site chrome, magazine, archive, reader, about 3D, admin, ad slots
lib/             Supabase clients, storage, queries, helpers
supabase/        schema.sql — run this once in the Supabase SQL editor
site.config.ts   Brand name, copy, contact details, ticker, categories
```

## Re-branding

Almost everything visible is in **`site.config.ts`** — the name, tagline,
phone number, address, ticker messages and ad categories. Change it there and the
whole site updates. Colours live in the `@theme` block at the top of
`app/globals.css`.
