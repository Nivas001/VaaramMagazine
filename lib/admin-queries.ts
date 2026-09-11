import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdBanner, Enquiry, Publication, Subscriber } from "@/lib/types";

/**
 * Admin reads use the signed-in user's own session (not the service role), so
 * Row Level Security still applies — a page can only ever show what a logged-in
 * admin is genuinely allowed to see.
 */

export async function adminGetPublications(): Promise<Publication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .order("edition_date", { ascending: false });

  if (error) {
    console.error("[admin] publications:", error.message);
    return [];
  }
  return (data ?? []) as Publication[];
}

export async function adminGetPublicationById(id: string): Promise<Publication | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] publication by id:", error.message);
    return null;
  }
  return (data ?? null) as Publication | null;
}

/**
 * Every banner, grouped the way the admin screen shows them: by placement, and
 * within a placement in the running order a reader will see them.
 */
export async function adminGetBanners(): Promise<AdBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin] banners:", error.message);
    return [];
  }
  return (data ?? []) as AdBanner[];
}

export async function adminGetBannerById(id: string): Promise<AdBanner | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] banner:", error.message);
    return null;
  }
  return (data as AdBanner) ?? null;
}

export async function adminGetEnquiries(): Promise<Enquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[admin] enquiries:", error.message);
    return [];
  }
  return (data ?? []) as Enquiry[];
}

export async function adminGetSubscribers(): Promise<Subscriber[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    // A project that has not run the latest schema.sql simply has no table
    // yet — the page says so rather than failing.
    console.error("[admin] subscribers:", error.message);
    return [];
  }
  return (data ?? []) as Subscriber[];
}
