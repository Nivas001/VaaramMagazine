"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { siteConfig } from "@/site.config";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  DEFAULT_ROTATE_SECONDS,
  MAX_ROTATE_SECONDS,
  MIN_ROTATE_SECONDS,
  formatSize,
  placementSpec,
  type AdBanner,
  type BannerPlacement,
} from "@/lib/types";
import {
  SITE_PAGES,
  capacityLabel,
  placementGuide,
  placementsOnPage,
} from "@/lib/placement-guide";
import { clickRate, runsOutLabel } from "@/lib/banner-status";
import { deleteBanner, duplicateBanner, updateBanner } from "@/app/admin/actions";
import { normaliseAdArtwork } from "@/lib/image-resize";
import { putToStorage, requestTicket } from "@/components/admin/UploadToStorage";
import { UploadZone, artworkProblem } from "./UploadZone";
import { SlotPreview } from "./SlotPreview";
import { StateChip } from "./BookingRow";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

const BOOKABLE = BANNER_PLACEMENTS.filter((p) => !p.legacy);

/** A timestamp column rendered into the value an <input type="date"> expects. */
function dateValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Editing one booking.
 *
 * Same shape as the booking form — the change on the left, the website on the
 * right — so that changing a slot or swapping artwork shows its consequence
 * before anything is saved. The most common edit by far is a renewal, so the
 * date row carries one-click extensions rather than making somebody work out
 * what three months from today is.
 */
export function EditBookingForm({
  banner,
  siblings,
}: {
  banner: AdBanner;
  /** Every other booking, so the preview can draw the slot as it really is. */
  siblings: AdBanner[];
}) {
  const router = useRouter();

  const [placement, setPlacement] = useState<BannerPlacement>(banner.placement);
  const [clientName, setClientName] = useState(banner.client_name);
  const [targetUrl, setTargetUrl] = useState(banner.target_url ?? "");
  const [edition, setEdition] = useState(banner.edition ?? "");
  const [sortOrder, setSortOrder] = useState(String(banner.sort_order ?? 0));
  const [rotateSeconds, setRotateSeconds] = useState(
    banner.rotate_seconds ? String(banner.rotate_seconds) : ""
  );
  const [startsAt, setStartsAt] = useState(dateValue(banner.starts_at));
  const [expiresAt, setExpiresAt] = useState(dateValue(banner.expires_at));
  const [isActive, setIsActive] = useState(banner.is_active);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const spec = useMemo(() => placementSpec(placement), [placement]);
  const moved = placement !== banner.placement;
  const formatChanged = spec.format !== placementSpec(banner.placement).format;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pick(incoming: File | null) {
    setError(null);
    if (!incoming) return;
    const problem = artworkProblem(incoming);
    if (problem) {
      setError(problem);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(incoming);
    setPreview(URL.createObjectURL(incoming));
  }

  function cancelReplacement() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setReplacing(false);
  }

  /** Push the end date out from today — the renewal every week brings. */
  function extend(months: number) {
    const from = new Date();
    const current = expiresAt ? new Date(`${expiresAt}T00:00:00Z`) : null;
    // Extend from whichever is later, so renewing early never shortens a run.
    const base = current && current > from ? current : from;
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    setExpiresAt(isoDay(next));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientName.trim()) {
      setError("Enter the advertiser's name so you can find this booking later.");
      return;
    }
    if (startsAt && expiresAt && expiresAt < startsAt) {
      setError("The end date is before the start date — swap them round.");
      return;
    }
    if (formatChanged && !file) {
      setError(
        `The new space uses a ${AD_FORMATS[spec.format].label.toLowerCase()} shape and the current artwork is a ${AD_FORMATS[
          placementSpec(banner.placement).format
        ].label.toLowerCase()}. Upload artwork drawn for the new shape, or put it back where it was.`
      );
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);
    setProgress(0);

    try {
      let artwork: { imageUrl: string; imageKey: string } | undefined;

      if (file) {
        setStage("Preparing artwork");
        const normalised = await normaliseAdArtwork(file, spec.format);
        setStage("Uploading artwork");
        const ticket = await requestTicket(normalised.name, normalised.type, normalised.size);
        await putToStorage(ticket, normalised, setProgress);
        artwork = { imageUrl: ticket.publicUrl, imageKey: ticket.objectKey };
      }

      setStage("Saving");
      const result = await updateBanner(banner.id, {
        clientName: clientName.trim(),
        targetUrl: targetUrl.trim(),
        placement,
        edition: edition || null,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
        sortOrder: sortOrder === "" ? null : Number(sortOrder),
        rotateSeconds: rotateSeconds === "" ? null : Number(rotateSeconds),
        isActive,
        ...artwork,
      });

      if (!result.ok) throw new Error(result.error);

      setSaved(true);
      cancelReplacement();
      router.refresh();
      setTimeout(() => router.push("/admin/banners"), 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the booking.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
      <div className="min-w-0 space-y-6">
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6"
        >
          {/* ── How it is doing ──────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[rgb(var(--hairline))] pb-5">
            <StateChip banner={banner} />
            <p className="text-[13px] text-[rgb(var(--text-muted))]">
              {banner.impressions.toLocaleString("en-CA")} views
              <span className="mx-2" aria-hidden>
                ·
              </span>
              {banner.clicks.toLocaleString("en-CA")} clicks
              <span className="mx-2" aria-hidden>
                ·
              </span>
              {clickRate(banner).toFixed(1)}% click rate
              <span className="mx-2" aria-hidden>
                ·
              </span>
              {runsOutLabel(banner)}
            </p>
          </div>

          {/* ── Artwork ──────────────────────────────────────────────────── */}
          <p className={cn(label, "mt-6")}>Artwork</p>

          {replacing ? (
            <>
              <p className="-mt-0.5 mb-3 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
                {AD_FORMATS[spec.format].hint} It is resized for you on upload, and
                the old file is left alone until you save.
              </p>
              <UploadZone
                size={formatSize(spec.format)}
                file={file}
                preview={preview}
                busy={busy}
                onPick={pick}
                onClear={() => {
                  if (preview) URL.revokeObjectURL(preview);
                  setFile(null);
                  setPreview(null);
                }}
              />
              <button
                type="button"
                onClick={cancelReplacement}
                disabled={busy}
                className="mt-2.5 cursor-pointer text-[13px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4 transition-colors hover:text-[rgb(var(--text))]"
              >
                Keep the artwork that is there now
              </button>
            </>
          ) : (
            <div className="rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.image_url}
                alt={`Current artwork for ${banner.client_name}`}
                className={cn(
                  // Capped: a tall tower at the full width of this column
                  // would stand 740px high and push the whole form off screen.
                  "max-h-[340px] w-full rounded border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain",
                  AD_FORMATS[placementSpec(banner.placement).format].className
                )}
              />
              <button
                type="button"
                onClick={() => setReplacing(true)}
                disabled={busy}
                className="mt-3 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-4 text-[13px] font-medium transition-colors hover:bg-[rgb(var(--surface-2))]"
              >
                <ImagePlus className="size-3.5" aria-hidden />
                Upload new artwork
              </button>
            </div>
          )}

          {/* ── Where ────────────────────────────────────────────────────── */}
          <div className="mt-6">
            <label htmlFor="placement" className={label}>
              Where it appears
            </label>
            <select
              id="placement"
              value={placement}
              onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
              className={cn(field, "appearance-none")}
            >
              {SITE_PAGES.map((page) => (
                <optgroup key={page.key} label={page.label}>
                  {placementsOnPage(page.key).map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} — {AD_FORMATS[p.format].label}
                    </option>
                  ))}
                </optgroup>
              ))}
              {/* The booking may sit in the retired slot, which nothing new can
                  be put into. Offering it keeps the select honest instead of
                  silently showing some other slot's name. */}
              {!BOOKABLE.some((p) => p.value === placement) && (
                <optgroup label="Retired">
                  <option value={placement}>{spec.label}</option>
                </optgroup>
              )}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
              {placementGuide(placement).where}{" "}
              <span className="font-semibold text-[rgb(var(--text))]">
                {capacityLabel(placement)}.
              </span>
            </p>

            {moved && formatChanged && (
              <p className="mt-2.5 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                That space is a different shape. Upload artwork drawn for it above,
                or the advertisement would sit in a band of empty background.
              </p>
            )}
          </div>

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="mt-6 grid gap-4">
            <div>
              <label htmlFor="clientName" className={label}>
                Advertiser name <span className="text-[rgb(var(--accent-text))]">*</span>
              </label>
              <input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                maxLength={160}
                className={field}
              />
            </div>

            <div>
              <label htmlFor="targetUrl" className={label}>
                Where a click should take the reader{" "}
                <span className="font-normal normal-case tracking-normal opacity-70">
                  (optional)
                </span>
              </label>
              <input
                id="targetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className={field}
                placeholder="https://example.com"
              />
            </div>

            {/* ── Dates ──────────────────────────────────────────────────── */}
            <div>
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className={cn(label, "mb-0")}>When it runs</span>
                {[1, 3, 6].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => extend(months)}
                    className="inline-flex h-8 cursor-pointer items-center rounded-full border border-[rgb(var(--hairline))] px-3 text-[12px] font-semibold text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--accent))]/50 hover:text-[rgb(var(--text))]"
                  >
                    +{months} month{months > 1 ? "s" : ""}
                  </button>
                ))}
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt("")}
                    className="inline-flex h-8 cursor-pointer items-center rounded-full px-2.5 text-[12px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4 hover:text-[rgb(var(--text))]"
                  >
                    Remove end date
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startsAt" className="sr-only">
                    Start showing on
                  </label>
                  <input
                    id="startsAt"
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className={field}
                  />
                  <p className="mt-1.5 text-[11.5px] text-[rgb(var(--text-faint))]">
                    Starts on. Blank means straight away.
                  </p>
                </div>
                <div>
                  <label htmlFor="expiresAt" className="sr-only">
                    Stop showing after
                  </label>
                  <input
                    id="expiresAt"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={field}
                  />
                  <p className="mt-1.5 text-[11.5px] text-[rgb(var(--text-faint))]">
                    Runs to the end of that day. Blank means it never stops.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edition" className={label}>
                  Only in one edition?
                </label>
                <select
                  id="edition"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className={cn(field, "appearance-none")}
                >
                  <option value="">Show in every edition</option>
                  {siteConfig.editions.map((e) => (
                    <option key={e.slug} value={e.slug}>
                      {e.name} only
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className={label}>
                  Position in the running order
                </label>
                <input
                  id="sortOrder"
                  type="number"
                  min={0}
                  step={10}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={field}
                />
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                  Lower numbers come first. Type a number to move it a long way; use
                  the arrows on the list for a single step.
                </p>
              </div>
            </div>

            {spec.mode === "carousel" && (
              <div>
                <label htmlFor="rotateSeconds" className={label}>
                  Seconds on screen{" "}
                  <span className="font-normal normal-case tracking-normal opacity-70">
                    (optional)
                  </span>
                </label>
                <input
                  id="rotateSeconds"
                  type="number"
                  min={MIN_ROTATE_SECONDS}
                  max={MAX_ROTATE_SECONDS}
                  step={1}
                  value={rotateSeconds}
                  onChange={(e) => setRotateSeconds(e.target.value)}
                  className={field}
                  placeholder={`${DEFAULT_ROTATE_SECONDS} seconds`}
                />
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                  How long this one holds its frame before the next takes over.
                  Blank means {DEFAULT_ROTATE_SECONDS} seconds. Anything from{" "}
                  {MIN_ROTATE_SECONDS} to {MAX_ROTATE_SECONDS}.
                </p>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 accent-[rgb(var(--accent))]"
              />
              Show it on the website
            </label>
          </div>

          {busy && (
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-2))]">
                <div
                  className="h-full rounded-full bg-[rgb(var(--accent))] transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {stage && (
                <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                  {stage}
                  {progress > 0 && ` — ${progress}%`}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          {saved && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <Check className="size-4 shrink-0" />
              Saved. Taking you back to the list.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-strong disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {busy ? "Saving" : "Save changes"}
            </button>
            <Link
              href="/admin/banners"
              className="text-[13px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4 hover:text-[rgb(var(--text))]"
            >
              Cancel
            </Link>
          </div>
        </form>

        <DuplicateToOtherPlacements banner={banner} />
        <DangerZone banner={banner} />
      </div>

      {/* ── The website, as it will look ─────────────────────────────────── */}
      <aside className="lg:sticky lg:top-40">
        <div className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-5">
          <h2 className="font-display text-lg tracking-[-0.02em]">Where it appears</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[rgb(var(--text-muted))]">
            {preview
              ? "Your new artwork, drawn into the page where a reader will meet it."
              : "This booking, drawn into the page where a reader meets it."}
          </p>
          <div className="mt-4">
            <SlotPreview
              placement={placement}
              banners={siblings}
              pending={{
                imageUrl: preview ?? banner.image_url,
                clientName: clientName || banner.client_name,
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

/**
 * Also book this same artwork — already uploaded, already approved — into
 * other spaces that share its shape.
 *
 * Deliberately narrower than the booking form's "put it in several places":
 * that one uploads fresh artwork per shape, so it can reach anywhere. This one
 * reuses the image already in storage, which only ever looks right in a space
 * of the same proportion — see duplicateBanner in app/admin/actions.ts.
 */
function DuplicateToOtherPlacements({ banner }: { banner: AdBanner }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<BannerPlacement>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const format = placementSpec(banner.placement).format;
  const options = BOOKABLE.filter(
    (p) => p.value !== banner.placement && p.format === format
  );

  if (options.length === 0) return null;

  async function onDuplicate() {
    if (picked.size === 0) {
      setError("Choose at least one space.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const result = await duplicateBanner(banner.id, [...picked]);
      if (!result.ok) throw new Error(result.error);
      setDone(result.created);
      setPicked(new Set());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy the booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-[rgb(var(--hairline))] p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Copy className="size-4 text-[rgb(var(--text-faint))]" aria-hidden />
          Put this same artwork in other spaces too
        </span>
        <span className="text-[12px] font-normal text-[rgb(var(--text-faint))]">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-3.5">
          <p className="text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            These spaces use the same{" "}
            {AD_FORMATS[format].label.toLowerCase()} shape, so the artwork already
            uploaded here fits straight in — nothing to re-upload. Each becomes its
            own booking that can be moved or removed on its own.
          </p>

          <div className="mt-3 space-y-1.5">
            {options.map((p) => (
              <label key={p.value} className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={picked.has(p.value)}
                  disabled={busy}
                  onChange={(e) => {
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(p.value);
                      else next.delete(p.value);
                      return next;
                    });
                  }}
                  className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--accent))]"
                />
                {p.label}
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}
          {done !== null && (
            <p className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              <Check className="size-3.5 shrink-0" />
              Copied into {done} more space{done === 1 ? "" : "s"}.
            </p>
          )}

          <button
            type="button"
            onClick={onDuplicate}
            disabled={busy || picked.size === 0}
            className="mt-3.5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            {busy ? "Copying…" : "Copy into the spaces ticked"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Deleting, kept away from Save and behind its own confirmation. */
function DangerZone({ banner }: { banner: AdBanner }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteBanner(banner.id);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    router.push("/admin/banners");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-[rgb(var(--hairline))] p-4">
      <p className="text-sm font-semibold">Remove this booking</p>
      <p className="mt-1.5 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
        Deleting takes the advertisement off the website and throws the artwork
        away for good, along with its view and click counts. To take it down and
        keep the record, untick “Show it on the website” above instead.
      </p>

      {error && (
        <p className="mt-3 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[rgb(var(--accent))] px-3.5 text-[13px] font-semibold text-white hover:bg-wine-strong disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Yes, delete {banner.client_name}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[13px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-semibold text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--accent))]/50 hover:text-[rgb(var(--accent-text))]"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Delete this booking
          </button>
        )}
      </div>
    </div>
  );
}
