"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, X } from "lucide-react";
import { siteConfig } from "@/site.config";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  DEFAULT_ROTATE_SECONDS,
  MAX_ROTATE_SECONDS,
  MIN_ROTATE_SECONDS,
  formatSize,
  placementSpec,
  type AdFormat,
  type BannerPlacement,
} from "@/lib/types";
import { createBanner, createBannerBatch } from "@/app/admin/actions";
import { normaliseAdArtwork } from "@/lib/image-resize";
import { putToStorage, requestTicket } from "./UploadToStorage";
import { cn, formatBytes } from "@/lib/utils";

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Kept in step with the ceiling the upload route enforces. */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Placements an admin may book into — the retired one is not offered. */
const BOOKABLE = BANNER_PLACEMENTS.filter((p) => !p.legacy);
const GROUPS = [...new Set(BOOKABLE.map((p) => p.group))];

export function BannerForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [placement, setPlacement] = useState<BannerPlacement>("site_rail");

  // Off by default: one placement at a time is the common case, and the
  // dropdown above stays the simplest possible form for it. Turning this on
  // swaps the dropdown for a checklist — see `selected` below — so the same
  // artwork can be booked into several placements from one upload instead of
  // repeating the whole form once per placement.
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Set<BannerPlacement>>(new Set());

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bookedCount, setBookedCount] = useState<number | null>(null);

  const spec = useMemo(() => placementSpec(placement), [placement]);

  // What is actually being booked into right now, single- or multi-mode —
  // everything below (artwork size, the rotation field) is driven from this
  // one list rather than branching twice.
  const activePlacements = multi ? [...selected] : [placement];
  const anyCarousel = activePlacements.some((p) => placementSpec(p).mode === "carousel");
  const neededFormats = useMemo(() => {
    const set = new Set(activePlacements.map((p) => placementSpec(p).format));
    // Falls back to a single format so the artwork hint always has something
    // to describe, even for the instant between turning multi mode on and
    // checking a first box — submission itself is still blocked separately.
    return set.size > 0 ? [...set] : (["card"] as AdFormat[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi, placement, selected]);

  function pick(incoming: File | null) {
    setError(null);
    if (!incoming) return;
    if (!IMAGE_TYPES.includes(incoming.type)) {
      setError("Banner images must be JPG, PNG or WebP.");
      return;
    }
    if (incoming.size > MAX_IMAGE_BYTES) {
      setError(
        `${incoming.name} is ${formatBytes(incoming.size)}. Banner artwork must be under 2 MB — export it smaller and try again.`
      );
      return;
    }
    setFile(incoming);
    setPreview(URL.createObjectURL(incoming));
  }

  function clear() {
    setFile(null);
    setPreview(null);
  }

  function toggleMulti() {
    if (multi) {
      // Back to one placement: carry over whichever was checked first rather
      // than leaving the dropdown pointed at something the admin never chose.
      setPlacement([...selected][0] ?? placement);
      setMulti(false);
    } else {
      setSelected(new Set([placement]));
      setMulti(true);
    }
  }

  function togglePlacement(value: BannerPlacement, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value);
      else next.delete(value);
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the artwork for this advertisement.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const clientName = String(data.get("clientName") ?? "").trim();
    if (!clientName) {
      setError("Enter the advertiser's name so you can identify this banner later.");
      return;
    }
    if (multi && selected.size === 0) {
      setError("Choose at least one placement.");
      return;
    }

    const targetUrl = String(data.get("targetUrl") ?? "").trim();
    const edition = String(data.get("edition") ?? "") || null;
    const startsAt = String(data.get("startsAt") ?? "") || null;
    const expiresAt = String(data.get("expiresAt") ?? "") || null;
    const sortOrderRaw = String(data.get("sortOrder") ?? "").trim();
    const rotateSecondsRaw = String(data.get("rotateSeconds") ?? "").trim();
    const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : null;
    const rotateSeconds = rotateSecondsRaw ? Number(rotateSecondsRaw) : null;
    const isActive = data.get("isActive") !== null;

    setBusy(true);
    setError(null);
    setProgress(0);
    setBookedCount(null);

    try {
      if (multi) {
        const targets = [...selected];
        const formats = [...new Set(targets.map((p) => placementSpec(p).format))];
        const artworkByFormat: Partial<Record<AdFormat, { imageUrl: string; imageKey: string }>> = {};

        // Redrawn once per *shape*, not once per placement — two placements
        // that both take a card share the one upload.
        for (let i = 0; i < formats.length; i += 1) {
          const format = formats[i];
          const tag = formats.length > 1 ? ` (${AD_FORMATS[format].label}, ${i + 1} of ${formats.length})` : "";
          setStage(`Preparing artwork${tag}`);
          const resized = await normaliseAdArtwork(file, format);
          setStage(`Uploading artwork${tag}`);
          const ticket = await requestTicket(resized.name, resized.type, resized.size);
          await putToStorage(ticket, resized, setProgress);
          artworkByFormat[format] = { imageUrl: ticket.publicUrl, imageKey: ticket.objectKey };
        }

        setStage("Saving");
        const result = await createBannerBatch({
          clientName,
          targetUrl,
          edition,
          startsAt,
          expiresAt,
          isActive,
          sortOrder,
          rotateSeconds,
          placements: targets,
          artworkByFormat: artworkByFormat as Record<string, { imageUrl: string; imageKey: string }>,
        });
        if (!result.ok) throw new Error(result.error);

        setBookedCount(result.created);
        formRef.current?.reset();
        clear();
        setSelected(new Set());
        setMulti(false);
        setPlacement("site_rail");
      } else {
        setStage("Preparing artwork");
        const artwork = await normaliseAdArtwork(file, spec.format);
        setStage("Uploading artwork");
        const ticket = await requestTicket(artwork.name, artwork.type, artwork.size);
        await putToStorage(ticket, artwork, setProgress);

        setStage("Saving");
        const result = await createBanner({
          clientName,
          targetUrl,
          imageUrl: ticket.publicUrl,
          imageKey: ticket.objectKey,
          placement,
          edition,
          startsAt,
          expiresAt,
          sortOrder,
          rotateSeconds,
          isActive,
        });
        if (!result.ok) throw new Error(result.error);

        formRef.current?.reset();
        clear();
        setPlacement("site_rail");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6"
    >
      <h2 className="text-lg font-bold">Add a banner</h2>
      <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">
        Choose where it appears first — the artwork size below changes to match
        what you picked.
      </p>

      {/* Placement leads, because it decides the size hint underneath. */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="placement" className={label}>
            Where it appears
          </label>
          <button
            type="button"
            onClick={toggleMulti}
            className="text-[12px] font-semibold text-[rgb(var(--accent-text))] underline decoration-[rgb(var(--accent))]/40 underline-offset-4 hover:decoration-[rgb(var(--accent))]"
          >
            {multi ? "Just one placement" : "Book into more than one placement"}
          </button>
        </div>

        {multi ? (
          <div className="mt-2 max-h-64 space-y-4 overflow-y-auto rounded-md border border-[rgb(var(--hairline))] p-3">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="label-eyebrow mb-2 text-[10px] text-[rgb(var(--text-faint))]">
                  {group}
                </p>
                <div className="space-y-1.5">
                  {BOOKABLE.filter((p) => p.group === group).map((p) => (
                    <label
                      key={p.value}
                      className="flex cursor-pointer items-start gap-2.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.value)}
                        onChange={(e) => togglePlacement(p.value, e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--accent))]"
                      />
                      <span>
                        {p.label}{" "}
                        <span className="text-[12px] font-normal text-[rgb(var(--text-faint))]">
                          ({AD_FORMATS[p.format].label})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <select
            id="placement"
            name="placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
            className={cn(field, "mt-2 appearance-none")}
          >
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {BOOKABLE.filter((p) => p.group === group).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
          {multi ? (
            selected.size === 0 ? (
              "Pick at least one placement above."
            ) : (
              <>
                This creates a separate booking in each of the {selected.size}{" "}
                placement{selected.size > 1 ? "s" : ""} checked — the same photo,
                resized to fit each one — so any single one can be reordered or
                removed later without touching the others.
              </>
            )
          ) : (
            <>
              {spec.hint}
              {spec.mode !== "carousel" ? (
                <span className="ml-1 font-semibold text-[rgb(var(--accent-text))]">
                  This slot shows every banner booked into it, so you can add as many
                  as you like.
                </span>
              ) : (
                <span className="ml-1 font-semibold text-[rgb(var(--accent-text))]">
                  {spec.slots && spec.slots > 1
                    ? `Banners here take turns in ${spec.slots} frames, in the order below.`
                    : "Banners here take turns in one frame, in the order below."}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* ── Artwork, one file for every screen ─────────────────────────── */}
      <div className="mt-6">
        <p className={label}>
          Artwork <span className="text-[rgb(var(--accent-text))]">*</span>
        </p>
        <p className="-mt-0.5 mb-3 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
          {neededFormats.length > 1 ? (
            <>
              One image is all you need — it is redrawn into{" "}
              {neededFormats
                .map((f) => `${AD_FORMATS[f].label} (${formatSize(f)})`)
                .join(" and ")}{" "}
              automatically, and the same picture is used on phones, tablets and
              desktops.
            </>
          ) : (
            <>
              One image is all you need. {AD_FORMATS[neededFormats[0]].hint} It is
              resized for you on upload, and the same picture is used on phones,
              tablets and desktops — only the space around it changes.
            </>
          )}
        </p>

        <UploadZone
          size={neededFormats.map((f) => formatSize(f)).join(" and ")}
          file={file}
          preview={preview}
          busy={busy}
          onPick={pick}
          onClear={clear}
        />
      </div>

      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="clientName" className={label}>
            Advertiser name <span className="text-[rgb(var(--accent-text))]">*</span>
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            maxLength={160}
            className={field}
            placeholder="e.g. Sri Balaji Motors"
          />
        </div>

        <div>
          <label htmlFor="targetUrl" className={label}>
            Link when clicked{" "}
            <span className="font-normal normal-case tracking-normal opacity-70">
              (optional)
            </span>
          </label>
          <input
            id="targetUrl"
            name="targetUrl"
            type="url"
            className={field}
            placeholder="https://example.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edition" className={label}>
              Only in one edition?
            </label>
            <select
              id="edition"
              name="edition"
              className={cn(field, "appearance-none")}
              defaultValue=""
            >
              <option value="">Show in all editions</option>
              {siteConfig.editions.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.name} only
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sortOrder" className={label}>
              Position{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">
                (optional)
              </span>
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              step={10}
              className={field}
              placeholder="Added to the end"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-[rgb(var(--text-faint))]">
              Lower numbers come first.
              {multi && " Applied in each placement checked above."}
            </p>
          </div>
        </div>

        {anyCarousel && (
          <div>
            <label htmlFor="rotateSeconds" className={label}>
              Seconds on screen{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">
                (optional)
              </span>
            </label>
            <input
              id="rotateSeconds"
              name="rotateSeconds"
              type="number"
              min={MIN_ROTATE_SECONDS}
              max={MAX_ROTATE_SECONDS}
              step={1}
              className={field}
              placeholder={`${DEFAULT_ROTATE_SECONDS} seconds`}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-[rgb(var(--text-faint))]">
              How long this one holds its frame before the next takes over.
              Leave it blank for {DEFAULT_ROTATE_SECONDS} seconds. Give an
              advertisement carrying an address or a phone number longer —
              anything from {MIN_ROTATE_SECONDS} to {MAX_ROTATE_SECONDS}.
              {multi && " Ignored by any placement checked above that shows every booking rather than rotating."}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className={label}>
              Start showing on{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">
                (optional)
              </span>
            </label>
            <input id="startsAt" name="startsAt" type="date" className={field} />
          </div>
          <div>
            <label htmlFor="expiresAt" className={label}>
              Stop showing on{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">
                (optional)
              </span>
            </label>
            <input id="expiresAt" name="expiresAt" type="date" className={field} />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked
            className="size-4 accent-[rgb(var(--accent))]"
          />
          Show it on the website straight away
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
              {stage} — {progress}%
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

      {bookedCount !== null && (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          Booked into {bookedCount} placement{bookedCount === 1 ? "" : "s"}.
        </p>
      )}

      <button
        type="submit"
        disabled={busy || (multi && selected.size === 0)}
        className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-strong disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy
          ? "Uploading"
          : multi
            ? `Book into ${selected.size || 0} placement${selected.size === 1 ? "" : "s"}`
            : "Add banner"}
      </button>
    </form>
  );
}

/** The artwork slot: pick a file, see it, or take it back out. */
export function UploadZone({
  size,
  file,
  preview,
  busy,
  onPick,
  onClear,
}: {
  size: string;
  file: File | null;
  preview: string | null;
  busy: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "rounded-md border p-3 transition-colors",
        preview
          ? "border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/50"
          : "border-dashed border-[rgb(var(--hairline))]",
        busy && "pointer-events-none opacity-60"
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[13px] font-semibold">Advertisement image</p>
        <p className="text-[11px] tabular-nums text-[rgb(var(--text-faint))]">
          {size} · JPG, PNG or WebP · under 2 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="mt-2.5 flex items-center gap-3">
          {/* A local object URL for the file just chosen. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-12 w-20 shrink-0 rounded border border-[rgb(var(--hairline))] object-contain"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-[rgb(var(--text-muted))]">
            {file?.name}
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
            {formatBytes(file?.size ?? 0)}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="grid size-7 shrink-0 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
            aria-label="Remove artwork"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2.5 inline-flex h-9 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-4 text-[13px] font-medium text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--surface-2))]"
        >
          <ImagePlus className="size-3.5" aria-hidden />
          Choose image
        </button>
      )}
    </div>
  );
}
