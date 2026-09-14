"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteObject } from "@/lib/storage";
import { placementSpec, type BannerPlacement } from "@/lib/types";
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
  /** Seconds on screen in a rotating slot. Null falls back to the default. */
  rotateSeconds?: number | null;
};

/**
 * Columns added after the first release, which a database that has not had the
 * latest schema.sql run against it will not have.
 *
 * Reading one of these is already safe — `select *` simply does not return it.
 * Writing one is not: Postgres rejects the whole statement, and an
 * administrator saving an unrelated change to a banner would be told their
 * edit failed for a reason that has nothing to do with what they typed.
 *
 * So a write carrying one of these is tried as-is and, if the column turns out
 * not to exist, tried again without it. Everything the administrator could see
 * on the form is saved either way; only the setting the database cannot hold
 * yet is dropped. Running schema.sql makes it stick, with nothing to re-enter.
 */
const OPTIONAL_COLUMNS = ["rotate_seconds"] as const;

function missingColumn(message: string | undefined) {
  if (!message) return null;
  return (
    OPTIONAL_COLUMNS.find(
      (column) =>
        message.includes(`'${column}'`) ||
        message.includes(`"${column}"`) ||
        message.includes(`column ${column}`) ||
        message.includes(`ad_banners.${column}`)
    ) ?? null
  );
}

/**
 * Runs a banner write, retrying without any column the database turns out not
 * to have. Returns the final error message, or null on success.
 */
async function writeBanner(
  payload: Record<string, unknown>,
  run: (payload: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>
): Promise<string | null> {
  const attempt = { ...payload };

  // At most one pass per optional column, plus the first — bounded, so a
  // message this never learns to recognise cannot spin.
  for (let i = 0; i <= OPTIONAL_COLUMNS.length; i += 1) {
    const { error } = await run(attempt);
    if (!error) return null;

    const column = missingColumn(error.message);
    if (!column || !(column in attempt)) return error.message;

    console.warn(
      `[admin] ad_banners.${column} is missing — saved without it. Run supabase/schema.sql.`
    );
    delete attempt[column];
  }

  return "Could not save the banner.";
}

/**
 * A calendar day typed into the admin, as the instant it actually means.
 *
 * Both forms ask for plain days, and a plain day handed to Postgres becomes
 * midnight at the *start* of it. For a start date that is right. For an end
 * date it is a day short: "stop showing on 31 December" would take the
 * advertisement down at one minute past midnight on the 31st, and the
 * advertiser would lose the last day they paid for — the kind of error nobody
 * notices until a client counts.
 *
 * Anything that is not a bare "YYYY-MM-DD" is passed through untouched, so a
 * full timestamp from elsewhere keeps its own time.
 */
const PLAIN_DAY = /^\d{4}-\d{2}-\d{2}$/;

function startOfDay(value: string | null) {
  if (!value) return null;
  return PLAIN_DAY.test(value) ? `${value}T00:00:00.000Z` : value;
}

function endOfDay(value: string | null) {
  if (!value) return null;
  return PLAIN_DAY.test(value) ? `${value}T23:59:59.999Z` : value;
}

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
    const failure = await writeBanner(
      {
        client_name: input.clientName,
        target_url: safeExternalUrl(input.targetUrl),
        image_url: input.imageUrl,
        image_key: input.imageKey,
        placement: input.placement,
        edition: input.edition,
        starts_at: startOfDay(input.startsAt),
        expires_at: endOfDay(input.expiresAt),
        sort_order:
          input.sortOrder ?? (await nextSortOrder(supabase, input.placement)),
        rotate_seconds: input.rotateSeconds ?? null,
        is_active: input.isActive,
      },
      (payload) => supabase.from("ad_banners").insert(payload)
    );
    if (failure) return { ok: false, error: failure };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/**
 * The same booking, placed into several placements at once.
 *
 * One row per placement is still what gets written — sort order, expiry and
 * per-banner rotation timing are all placement-specific, and an admin who
 * wants to remove or reorder the booking in just one of them later needs
 * separate rows to do it to. What this saves is everything upstream of that:
 * the artwork is uploaded once per *shape* needed (not once per placement —
 * two placements that both take a card share the one upload), and every
 * other field is typed once.
 *
 * Best-effort rather than transactional: Supabase's REST API has no
 * multi-table transaction for this app to reach for (see the note on
 * moveBanner below), so a failure partway through leaves whatever was
 * already written in place. The error message says how many succeeded before
 * the failure, so the admin knows whether to retry the rest by hand rather
 * than assuming nothing happened.
 */
export async function createBannerBatch(input: {
  clientName: string;
  targetUrl: string;
  edition: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  rotateSeconds?: number | null;
  /** Applied literally to every placement, or left to append to each one's own end. */
  sortOrder?: number | null;
  placements: string[];
  /** One uploaded artwork per distinct AdFormat the chosen placements need. */
  artworkByFormat: Record<string, { imageUrl: string; imageKey: string }>;
}): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  try {
    const supabase = await requireAdmin();
    const targetUrl = safeExternalUrl(input.targetUrl);

    if (input.placements.length === 0) {
      return { ok: false, error: "Choose at least one placement." };
    }

    let created = 0;
    for (const placement of input.placements) {
      const spec = placementSpec(placement as BannerPlacement);
      const artwork = input.artworkByFormat[spec.format];
      if (!artwork) {
        const where = created > 0 ? `Booked into ${created} so far. ` : "";
        return { ok: false, error: `${where}No ${spec.format} artwork was prepared for "${spec.label}".` };
      }

      const failure = await writeBanner(
        {
          client_name: input.clientName,
          target_url: targetUrl,
          image_url: artwork.imageUrl,
          image_key: artwork.imageKey,
          placement,
          edition: input.edition,
          starts_at: startOfDay(input.startsAt),
          expires_at: endOfDay(input.expiresAt),
          sort_order: input.sortOrder ?? (await nextSortOrder(supabase, placement)),
          rotate_seconds: input.rotateSeconds ?? null,
          is_active: input.isActive,
        },
        (payload) => supabase.from("ad_banners").insert(payload)
      );
      if (failure) {
        const where = created > 0 ? `Booked into ${created} before this failed. ` : "";
        return { ok: false, error: `${where}${spec.label}: ${failure}` };
      }
      created += 1;
    }

    refreshPublicPages();
    return { ok: true, created };
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
      starts_at: startOfDay(input.startsAt),
      expires_at: endOfDay(input.expiresAt),
      is_active: input.isActive,
      updated_at: new Date().toISOString(),
    };
    if (typeof input.sortOrder === "number") patch.sort_order = input.sortOrder;
    if (input.rotateSeconds !== undefined) patch.rotate_seconds = input.rotateSeconds;
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

    const failure = await writeBanner(patch, (payload) =>
      supabase.from("ad_banners").update(payload).eq("id", id)
    );
    if (failure) return { ok: false, error: failure };

    refreshPublicPages();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

/**
 * Books an existing banner's artwork into further placements, without asking
 * for it again.
 *
 * Only offered — by the admin UI, and enforced again here — between
 * placements that share an artwork format. The image already sitting in
 * storage was drawn to one exact shape (see normaliseAdArtwork), and putting
 * it into a placement of a different shape would either crop it or surround
 * it in a band of white that was never part of the design. An admin wanting
 * that needs to upload artwork suited to the new shape, which is exactly what
 * editing that placement's own booking already does.
 *
 * Each target becomes its own row with its own id, sort order and impression
 * count — editable, reorderable and deletable independently of the booking it
 * was copied from and of every other one made alongside it.
 */
export async function duplicateBanner(
  id: string,
  placements: string[]
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  try {
    const supabase = await requireAdmin();
    if (placements.length === 0) {
      return { ok: false, error: "Choose at least one placement." };
    }

    const { data: source, error: readError } = await supabase
      .from("ad_banners")
      .select(
        "client_name, target_url, image_url, image_key, placement, edition, starts_at, expires_at, is_active, rotate_seconds"
      )
      .eq("id", id)
      .maybeSingle();
    if (readError) return { ok: false, error: readError.message };
    if (!source) return { ok: false, error: "That banner no longer exists." };

    const sourceFormat = placementSpec(source.placement as BannerPlacement).format;
    const mismatched = placements.filter(
      (p) => placementSpec(p as BannerPlacement).format !== sourceFormat
    );
    if (mismatched.length > 0) {
      const labels = mismatched.map((p) => placementSpec(p as BannerPlacement).label);
      return {
        ok: false,
        error: `${labels.join(", ")} use a different artwork shape than this booking — edit a new booking there with artwork sized for it instead.`,
      };
    }

    let created = 0;
    for (const placement of placements) {
      const failure = await writeBanner(
        {
          client_name: source.client_name,
          target_url: source.target_url,
          image_url: source.image_url,
          image_key: source.image_key,
          placement,
          edition: source.edition,
          starts_at: source.starts_at,
          expires_at: source.expires_at,
          sort_order: await nextSortOrder(supabase, placement),
          rotate_seconds: source.rotate_seconds ?? null,
          is_active: source.is_active,
        },
        (payload) => supabase.from("ad_banners").insert(payload)
      );
      if (failure) {
        const where = created > 0 ? `Booked into ${created} before this failed. ` : "";
        const label = placementSpec(placement as BannerPlacement).label;
        return { ok: false, error: `${where}${label}: ${failure}` };
      }
      created += 1;
    }

    refreshPublicPages();
    return { ok: true, created };
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

    // Written as plain row updates rather than a single set_banner_order(jsonb)
    // statement: that function has to exist in the database, and a project
    // whose schema.sql was updated without being re-run against the live
    // database (exactly what happened here) would fail with "Could not find
    // the function ... in the schema cache" on every reorder. Individual
    // updates go through the same admin RLS policy every other banner action
    // already relies on, so this works with no migration required.
    //
    // Only rows whose position actually changed are written. That has to be
    // checked by id, not by array index: after a swap, the banner now sitting
    // at index i is a *different* banner than the one that sat there before,
    // so comparing the new value at index i against the old value at index i
    // silently compares two unrelated banners — and for a plain two-item swap
    // those happen to be numerically equal, which erased both real changes
    // the first time this was written.
    const originalById = new Map(list.map((b) => [b.id, b.sort_order]));
    const updates = reordered
      .map((b, i) => ({ id: b.id, sort_order: (i + 1) * 10 }))
      .filter((b) => b.sort_order !== originalById.get(b.id));

    const results = await Promise.all(
      updates.map((b) =>
        supabase.from("ad_banners").update({ sort_order: b.sort_order }).eq("id", b.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

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
