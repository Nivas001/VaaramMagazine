"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteObject } from "@/lib/storage";
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

type BannerInput = {
  clientName: string;
  targetUrl: string;
  placement: string;
  edition: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  /** Where it sits in its rail. Left out on create to append to the end. */
  sortOrder?: number | null;
};

/**
 * The next free position at the end of a placement's running order.
 *
 * Positions step in tens so a banner can later be dropped between two others
 * by typing a number, without having to renumber everything after it.
 */
async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  placement: string
) {
  const { data } = await supabase
    .from("ad_banners")
    .select("sort_order")
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1);

  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 10;
}

export async function createBanner(
  input: BannerInput & {
    /** One artwork now serves every screen; see AD_FORMATS in lib/types.ts. */
    imageUrl: string;
    imageKey: string;
  }
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("ad_banners").insert({
      client_name: input.clientName,
      target_url: safeExternalUrl(input.targetUrl),
      image_url: input.imageUrl,
      image_key: input.imageKey,
      placement: input.placement,
      edition: input.edition,
      starts_at: input.startsAt,
      expires_at: input.expiresAt,
      sort_order:
        input.sortOrder ?? (await nextSortOrder(supabase, input.placement)),
      is_active: input.isActive,
    });
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/**
 * Edit an existing booking.
 *
 * Artwork is only touched when replacement artwork was actually uploaded, and
 * the file it replaces is deliberately left in storage: an admin who swaps an
 * image and then thinks better of it can be pointed back at the old URL, which
 * an unrecoverable delete would make impossible. A stranded file costs a few
 * tens of kilobytes.
 */
export async function updateBanner(
  id: string,
  input: BannerInput & { imageUrl?: string; imageKey?: string }
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    const patch: Record<string, unknown> = {
      client_name: input.clientName,
      target_url: safeExternalUrl(input.targetUrl),
      placement: input.placement,
      edition: input.edition,
      starts_at: input.startsAt,
      expires_at: input.expiresAt,
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    };
    if (typeof input.sortOrder === "number") patch.sort_order = input.sortOrder;
    if (input.imageUrl) {
      patch.image_url = input.imageUrl;
      patch.image_key = input.imageKey ?? null;
      // New artwork is one file for every screen, so any per-device artwork
      // left over from the old three-file form would now contradict it.
      patch.image_url_tablet = null;
      patch.image_key_tablet = null;
      patch.image_url_mobile = null;
      patch.image_key_mobile = null;
    }

    const { error } = await supabase.from("ad_banners").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/**
 * Move a banner one place up or down its rail, by swapping positions with the
 * neighbour above or below it. Nothing happens at either end.
 */
export async function moveBanner(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    const { data: row, error: readError } = await supabase
      .from("ad_banners")
      .select("id, placement, sort_order")
      .eq("id", id)
      .maybeSingle();
    if (readError) return { ok: false, error: readError.message };
    if (!row) return { ok: false, error: "That banner no longer exists." };

    const { data: siblings, error: listError } = await supabase
      .from("ad_banners")
      .select("id, sort_order")
      .eq("placement", row.placement)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (listError) return { ok: false, error: listError.message };

    const list = (siblings ?? []) as { id: string; sort_order: number }[];
    const at = list.findIndex((b) => b.id === id);
    const swapWith = direction === "up" ? at - 1 : at + 1;
    if (at === -1 || swapWith < 0 || swapWith >= list.length) return { ok: true };

    // Rewritten by index rather than by swapping the two stored numbers, so a
    // rail whose positions were never set — every one of them still 0 — comes
    // out correctly ordered instead of doing nothing.
    const reordered = [...list];
    [reordered[at], reordered[swapWith]] = [reordered[swapWith], reordered[at]];

    const { error } = await supabase.rpc("set_banner_order", {
      payload: reordered.map((b, i) => ({ id: b.id, sort_order: (i + 1) * 10 })),
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

    // Read the keys before the row goes, or there is nothing left to tidy up.
    const { data: row } = await supabase
      .from("ad_banners")
      .select("image_key, image_key_tablet, image_key_mobile")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("ad_banners").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    // Unlike a published edition's PDF, banner artwork is not worth keeping
    // once the booking is gone — advertisements turn over weekly. Best-effort
    // only: a storage failure must not make a successful delete look failed.
    const keys = [row?.image_key, row?.image_key_tablet, row?.image_key_mobile].filter(
      (key): key is string => Boolean(key)
    );
    for (const key of keys) {
      try {
        await deleteObject(key);
      } catch (storageError) {
        console.error("[admin] deleteBanner artwork:", key, storageError);
      }
    }

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
