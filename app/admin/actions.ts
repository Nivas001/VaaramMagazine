"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeExternalUrl, slugify } from "@/lib/utils";

/**
 * Every action re-checks the session. Middleware already guards the routes, but
 * a Server Action is a public endpoint of its own and must verify on its own.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to sign in first.");
  return supabase;
}

/**
 * Everything public renders under the root layout, so one layout-level
 * revalidation covers the home page, the archive, every edition page and the
 * footer's banner slot in a single call.
 */
function refreshPublicPages() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

export type ActionResult = { ok: true; slug?: string } | { ok: false; error: string };

/* ── Issues ─────────────────────────────────────────────────────────────── */

export async function createPublication(input: {
  title: string;
  description: string;
  edition: string;
  editionDate: string;
  pdfUrl: string;
  pdfKey: string;
  fileSizeBytes: number;
  totalPages: number | null;
  coverUrl: string | null;
  isPublished: boolean;
}): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    // Slugs must be unique and readable: "week-of-2026-05-04-pondicherry".
    const base = slugify(`${input.editionDate}-${input.edition}-${input.title}`).slice(0, 80);
    let slug = base;
    for (let attempt = 1; attempt < 20; attempt++) {
      const { data } = await supabase.from("publications").select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${base}-${attempt + 1}`;
    }

    const { error } = await supabase.from("publications").insert({
      title: input.title,
      slug,
      description: input.description || null,
      edition: input.edition,
      edition_date: input.editionDate,
      pdf_url: input.pdfUrl,
      pdf_key: input.pdfKey,
      file_size_bytes: input.fileSizeBytes,
      total_pages: input.totalPages,
      cover_url: input.coverUrl,
      is_published: input.isPublished,
    });

    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true, slug };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updatePublication(
  id: string,
  input: {
    title: string;
    description: string;
    edition: string;
    editionDate: string;
    coverUrl?: string | null;
    isPublished?: boolean;
    pdfUrl?: string;
    pdfKey?: string;
    fileSizeBytes?: number;
    totalPages?: number | null;
  }
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    const updatePayload: Record<string, unknown> = {
      title: input.title,
      description: input.description || null,
      edition: input.edition,
      edition_date: input.editionDate,
    };

    if (input.coverUrl !== undefined) {
      updatePayload.cover_url = input.coverUrl;
    }

    if (input.isPublished !== undefined) {
      updatePayload.is_published = input.isPublished;
    }

    if (input.pdfUrl && input.pdfKey) {
      updatePayload.pdf_url = input.pdfUrl;
      updatePayload.pdf_key = input.pdfKey;
      if (input.fileSizeBytes !== undefined) {
        updatePayload.file_size_bytes = input.fileSizeBytes;
      }
      if (input.totalPages !== undefined) {
        updatePayload.total_pages = input.totalPages;
      }
    }

    const { error } = await supabase
      .from("publications")
      .update(updatePayload)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function togglePublication(id: string, isPublished: boolean): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("publications")
      .update({ is_published: isPublished })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deletePublication(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("publications").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    // Note: the PDF itself stays in storage. Keeping it means an accidental
    // delete never loses the file, and storage is far cheaper than regret.
    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/* ── Banners ────────────────────────────────────────────────────────────── */

export async function createBanner(input: {
  clientName: string;
  targetUrl: string;
  /** Desktop artwork is required; the other two tiers fall back to it. */
  imageUrl: string;
  imageKey: string;
  imageUrlTablet: string | null;
  imageKeyTablet: string | null;
  imageUrlMobile: string | null;
  imageKeyMobile: string | null;
  placement: string;
  edition: string | null;
  expiresAt: string | null;
}): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("ad_banners").insert({
      client_name: input.clientName,
      target_url: safeExternalUrl(input.targetUrl),
      image_url: input.imageUrl,
      image_key: input.imageKey,
      image_url_tablet: input.imageUrlTablet,
      image_key_tablet: input.imageKeyTablet,
      image_url_mobile: input.imageUrlMobile,
      image_key_mobile: input.imageKeyMobile,
      placement: input.placement,
      edition: input.edition,
      expires_at: input.expiresAt,
      is_active: true,
    });
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function toggleBanner(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("ad_banners").update({ is_active: isActive }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("ad_banners").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/* ── Enquiries ──────────────────────────────────────────────────────────── */

export async function setEnquiryStatus(
  id: string,
  status: "new" | "contacted" | "closed"
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/enquiries");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/enquiries");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/* ── Subscribers ────────────────────────────────────────────────────────── */

/**
 * Unsubscribing keeps the row and flips the flag. Deleting it would let the
 * same address be re-added by the next import, which is exactly what the
 * person asked us not to do.
 */
export async function setSubscriberActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("subscribers")
      .update({
        is_active: isActive,
        unsubscribed_at: isActive ? null : new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/subscribers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
