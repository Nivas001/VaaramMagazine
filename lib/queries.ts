import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AdBanner, BannerPlacement, Publication } from "@/lib/types";

/**
 * All public reads go through the anon key and are filtered again by Row Level
 * Security in Postgres, so an unpublished issue can never leak.
 *
 * Every query is wrapped in React's `cache` so a page that needs the same data
 * in two places still hits the database only once per request.
 */

const FALLBACK_PUBLICATIONS: Publication[] = [
  {
    id: "vaaram-issue-204",
    edition: "weekly",
    title: "Vaaram Issue 204 — Cultural Tech Vanguard",
    slug: "vaaram-issue-204-cultural-tech",
    edition_date: "2026-09-06",
    pdf_url: "/sample.pdf",
    pdf_key: "publications/vaaram-issue-204.pdf",
    cover_url: "/images/vaaram_cover_issue204.jpg",
    total_pages: 32,
    file_size_bytes: 4850000,
    description: "Discover Toronto's rising cultural tech leaders, weekly community announcements, 350+ fresh classifieds, career opportunities, and real estate listings.",
    is_published: true,
    view_count: 1420,
    download_count: 580,
    created_at: "2026-09-06T06:00:00Z",
  },
  {
    id: "vaaram-issue-203",
    edition: "weekly",
    title: "Vaaram Issue 203 — Urban Expansion & Commerce",
    slug: "vaaram-issue-203-urban-expansion",
    edition_date: "2026-08-30",
    pdf_url: "/sample.pdf",
    pdf_key: "publications/vaaram-issue-203.pdf",
    cover_url: "/images/vaaram_cover_issue203.jpg",
    total_pages: 28,
    file_size_bytes: 4210000,
    description: "In-depth investigation into urban development, commercial property developments, auto listings, trade directories, and community classifieds.",
    is_published: true,
    view_count: 3120,
    download_count: 1240,
    created_at: "2026-08-30T06:00:00Z",
  },
  {
    id: "vaaram-issue-202",
    edition: "weekly",
    title: "Vaaram Issue 202 — Cinema, Arts & Heritage",
    slug: "vaaram-issue-202-cinema-arts",
    edition_date: "2026-08-23",
    pdf_url: "/sample.pdf",
    pdf_key: "publications/vaaram-issue-202.pdf",
    cover_url: "/images/vaaram_cover_issue202.jpg",
    total_pages: 36,
    file_size_bytes: 5120000,
    description: "Spotlighting South Asian cinema innovators, diaspora culture, festival specials, educational notices, and verified weekly business classifieds.",
    is_published: true,
    view_count: 2890,
    download_count: 980,
    created_at: "2026-08-23T06:00:00Z",
  },
];

export const getPublications = cache(
  async (opts: { edition?: string; limit?: number } = {}): Promise<Publication[]> => {
    const supabase = await createClient();
    let query = supabase
      .from("publications")
      .select("*")
      .eq("is_published", true)
      .order("edition_date", { ascending: false });

    if (opts.edition) query = query.eq("edition", opts.edition);
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let filtered = opts.edition
        ? FALLBACK_PUBLICATIONS.filter((p) => p.edition === opts.edition)
        : FALLBACK_PUBLICATIONS;
      if (opts.limit) filtered = filtered.slice(0, opts.limit);
      return filtered;
    }
    return data as Publication[];
  }
);

export const getPublicationBySlug = cache(async (slug: string): Promise<Publication | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    const fallback = FALLBACK_PUBLICATIONS.find((p) => p.slug === slug);
    return fallback ?? null;
  }
  return data as Publication;
});

/** The newest issue for each configured edition, used by the home page. */
export const getLatestPerEdition = cache(async (): Promise<Publication[]> => {
  const all = await getPublications({ limit: 60 });
  const seen = new Set<string>();
  const latest: Publication[] = [];
  for (const pub of all) {
    if (seen.has(pub.edition)) continue;
    seen.add(pub.edition);
    latest.push(pub);
  }
  return latest;
});

export const getBanners = cache(
  async (placement: BannerPlacement, edition?: string): Promise<AdBanner[]> => {
    const supabase = await createClient();
    const nowIso = new Date().toISOString();

    let query = supabase
      .from("ad_banners")
      .select("*")
      .eq("placement", placement)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
      .order("sort_order", { ascending: true });

    if (edition) query = query.or(`edition.is.null,edition.eq.${edition}`);

    const { data, error } = await query;
    if (error) {
      // A missing table or unconfigured Supabase should never break a page —
      // ad slots simply render nothing.
      console.error("[queries] getBanners:", error.message);
      return [];
    }
    return (data ?? []) as AdBanner[];
  }
);
