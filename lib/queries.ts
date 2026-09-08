import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEMO_PUBLICATIONS } from "@/lib/demo-data";
import type { AdBanner, BannerPlacement, Publication } from "@/lib/types";

/**
 * All public reads go through the anon key and are filtered again by Row Level
 * Security in Postgres, so an unpublished issue can never leak.
 *
 * Each query is wrapped in React's `cache`, so a page needing the same data in
 * two places still hits the database only once per request.
 *
 * When Supabase is unreachable or has no rows yet, reads fall back to the demo
 * editions in lib/demo-data.ts. That keeps the site fully browsable before the
 * backend is connected, and the fallback disappears the moment a real issue is
 * published.
 */

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
      let fallback = opts.edition
        ? DEMO_PUBLICATIONS.filter((p) => p.edition === opts.edition)
        : DEMO_PUBLICATIONS;
      if (opts.limit) fallback = fallback.slice(0, opts.limit);
      return fallback;
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

  if (error || !data) return DEMO_PUBLICATIONS.find((p) => p.slug === slug) ?? null;
  return data as Publication;
});

/** The single newest published edition — the star of the home page. */
export const getLatestPublication = cache(async (): Promise<Publication | null> => {
  const [latest] = await getPublications({ limit: 1 });
  return latest ?? null;
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
      // A missing table or unconfigured Supabase must never break a page —
      // the advertisement slot simply renders nothing.
      console.error("[queries] getBanners:", error.message);
      return [];
    }
    return (data ?? []) as AdBanner[];
  }
);
