import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEMO_BANNERS, DEMO_PUBLICATIONS } from "@/lib/demo-data";
import type { AdBanner, BannerPlacement, Publication } from "@/lib/types";
import { safeExternalUrl } from "@/lib/utils";

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

/**
 * Every live banner, in one query.
 *
 * A page now draws on several slots at once — a side rail, three or four wide
 * strips and the footer grid — and React's `cache` cannot merge those into one
 * round trip because each call carries a different placement. Fetching the lot
 * once and filtering in memory turns six queries into one. A weekly magazine
 * carries tens of banners, not thousands, so the whole set is small.
 *
 * The limit is a tripwire rather than an expectation: if it is ever reached,
 * this needs to go back to querying per placement.
 */
const getAllLiveBanners = cache(async (): Promise<AdBanner[]> => {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    // A missing table or unconfigured Supabase must never break a page —
    // the advertisement slot simply renders nothing.
    console.error("[queries] getAllLiveBanners:", error.message);
    return [];
  }

  const rows = (data ?? []) as AdBanner[];

  // Nothing is invented in production. A placeholder edition is a harmless
  // stand-in, but a placeholder *advertiser* is a commercial claim about a
  // business that never booked anything, with impression counts behind it that
  // would be fiction. So the demo banners are strictly a local convenience.
  if (rows.length === 0 && process.env.NODE_ENV !== "production") {
    return DEMO_BANNERS;
  }

  // Sanitised here, at the boundary, rather than only where it is rendered.
  // These rows are serialised into the page as props for a client component,
  // so a "javascript:" link left on the object would travel to the browser as
  // data even though nothing would click it. Cleaning it once, on the server,
  // means the value never leaves the machine that can still reason about it.
  return rows.map((banner) => ({
    ...banner,
    target_url: safeExternalUrl(banner.target_url),
  }));
});

/** A banner runs in one edition only, or in every edition. */
function runsInEdition(banner: AdBanner, edition?: string) {
  return !edition || banner.edition === null || banner.edition === edition;
}

export const getBanners = cache(
  async (placement: BannerPlacement, edition?: string): Promise<AdBanner[]> =>
    (await getAllLiveBanners()).filter(
      (b) => b.placement === placement && runsInEdition(b, edition)
    )
);

/**
 * Several placements at once, in the order given — so a thin rail can top
 * itself up from a fuller one. A banner booked into two of the listed
 * placements still appears once.
 */
export const getBannersFor = cache(
  async (placements: BannerPlacement[], edition?: string): Promise<AdBanner[]> => {
    const all = await getAllLiveBanners();
    const seen = new Set<string>();
    const out: AdBanner[] = [];

    for (const placement of placements) {
      for (const banner of all) {
        if (banner.placement !== placement) continue;
        if (!runsInEdition(banner, edition)) continue;
        if (seen.has(banner.id)) continue;
        seen.add(banner.id);
        out.push(banner);
      }
    }
    return out;
  }
);
