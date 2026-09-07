import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdBanner, Enquiry, Publication } from "@/lib/types";

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

export async function adminGetBanners(): Promise<AdBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_banners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] banners:", error.message);
    return [];
  }
  return (data ?? []) as AdBanner[];
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
