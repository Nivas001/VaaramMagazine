-- ═══════════════════════════════════════════════════════════════════════════
--  DATABASE SETUP
--  Paste this whole file into the Supabase SQL Editor and press RUN.
--  It is safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
--  1. PUBLICATIONS — one row per weekly issue
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.publications (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  title            varchar(200) not null,
  slug             varchar(200) not null unique,
  description      text,
  edition          varchar(60)  not null,          -- matches a slug in site.config.ts
  edition_date     date         not null,
  pdf_url          text         not null,
  pdf_key          text         not null,
  file_size_bytes  bigint,
  total_pages      integer,
  cover_url        text,
  is_published     boolean      not null default true,
  view_count       integer      not null default 0,
  download_count   integer      not null default 0
);

create index if not exists publications_edition_date_idx
  on public.publications (edition, edition_date desc);
create index if not exists publications_published_idx
  on public.publications (is_published, edition_date desc);

-- ───────────────────────────────────────────────────────────────────────────
--  2. AD BANNERS — sponsored images placed around the site
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.ad_banners (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  client_name  varchar(160) not null,
  target_url   text,
  image_url    text not null,
  image_key    text,
  placement    varchar(40) not null,               -- see BANNER_PLACEMENTS in lib/types.ts
  edition      varchar(60),                        -- null = show in every edition
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  starts_at    timestamptz,
  expires_at   timestamptz,
  impressions  integer not null default 0,
  clicks       integer not null default 0
);

-- Per-device artwork. A 1600 x 200 desktop strip is unreadable on a phone, so
-- a banner may carry its own tablet and phone artwork; both are optional and
-- fall back to image_url. Added after launch, hence the ALTERs.
alter table public.ad_banners add column if not exists image_url_tablet text;
alter table public.ad_banners add column if not exists image_key_tablet text;
alter table public.ad_banners add column if not exists image_url_mobile text;
alter table public.ad_banners add column if not exists image_key_mobile text;

create index if not exists ad_banners_lookup_idx
  on public.ad_banners (placement, is_active, sort_order);

-- ───────────────────────────────────────────────────────────────────────────
--  3. ENQUIRIES — messages from the contact and advertise forms
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        varchar(120) not null,
  email       varchar(160),
  phone       varchar(30)  not null,
  edition     varchar(60),
  category    varchar(120),
  subject     varchar(160) not null,
  message     text         not null,
  source      varchar(40)  not null default 'contact',
  status      varchar(20)  not null default 'new'
              check (status in ('new', 'contacted', 'closed'))
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx  on public.enquiries (status, created_at desc);

-- ───────────────────────────────────────────────────────────────────────────
--  4. SUBSCRIBERS — readers who asked to be told when an edition goes live
--
--  Deliberately minimal: an address, where it was collected, and whether it is
--  still active. No name, no preferences, nothing that would make this a
--  profile. `email` is unique and stored lower-case, so re-subscribing simply
--  reactivates the row that is already there.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  email           varchar(190) not null unique,
  source          varchar(40)  not null default 'home',
  is_active       boolean      not null default true,
  unsubscribed_at timestamptz
);

create index if not exists subscribers_active_idx
  on public.subscribers (is_active, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Visitors may read published issues and active banners, and nothing else.
--  Only a signed-in admin can change anything.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.publications enable row level security;
alter table public.ad_banners   enable row level security;
alter table public.enquiries    enable row level security;
alter table public.subscribers  enable row level security;

drop policy if exists "public reads published issues"  on public.publications;
drop policy if exists "admins manage issues"           on public.publications;
drop policy if exists "public reads active banners"    on public.ad_banners;
drop policy if exists "admins manage banners"          on public.ad_banners;
drop policy if exists "admins read enquiries"          on public.enquiries;
drop policy if exists "admins manage enquiries"        on public.enquiries;
drop policy if exists "admins manage subscribers"      on public.subscribers;

create policy "public reads published issues"
  on public.publications for select
  using (is_published = true);

create policy "admins manage issues"
  on public.publications for all
  to authenticated
  using (true) with check (true);

create policy "public reads active banners"
  on public.ad_banners for select
  using (
    is_active = true
    and (starts_at  is null or starts_at  <= now())
    and (expires_at is null or expires_at >= now())
  );

create policy "admins manage banners"
  on public.ad_banners for all
  to authenticated
  using (true) with check (true);

-- Enquiries are never publicly readable. The website writes them using the
-- service-role key from a server route, which bypasses RLS by design.
create policy "admins manage enquiries"
  on public.enquiries for all
  to authenticated
  using (true) with check (true);

-- Subscriber addresses are personal data and are never publicly readable. The
-- signup route writes them with the service-role key, same as enquiries.
create policy "admins manage subscribers"
  on public.subscribers for all
  to authenticated
  using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
--  COUNTERS
--  Atomic increments so two readers at the same instant can't lose a count.
--  security definer lets the website call these without write access to the
--  tables; each one only ever touches a single counter column.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.increment_publication_view(pub_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.publications set view_count = view_count + 1 where id = pub_id;
$$;

create or replace function public.increment_publication_download(pub_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.publications set download_count = download_count + 1 where id = pub_id;
$$;

create or replace function public.increment_banner_impression(banner_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ad_banners set impressions = impressions + 1 where id = banner_id;
$$;

create or replace function public.increment_banner_click(banner_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.ad_banners set clicks = clicks + 1 where id = banner_id;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
--  OPTIONAL: Supabase Storage fallback
--  Only needed if you are NOT using Cloudflare R2. Creates a public bucket
--  called "media" that signed-in admins can upload into.
-- ═══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public reads media"   on storage.objects;
drop policy if exists "admins write media"   on storage.objects;

create policy "public reads media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "admins write media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');
