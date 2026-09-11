"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";
import { siteConfig } from "@/site.config";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  formatSize,
  placementSpec,
  type BannerPlacement,
} from "@/lib/types";
import { createBanner } from "@/app/admin/actions";
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const spec = useMemo(() => placementSpec(placement), [placement]);

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

    setBusy(true);
    setError(null);
    setProgress(0);

    try {
      // Redrawn to the slot's exact size first. A page can carry twenty of
      // these, and every byte uploaded is a byte each visitor downloads.
      setStage("Preparing artwork");
      const artwork = await normaliseAdArtwork(file, spec.format);

      setStage("Uploading artwork");
      const ticket = await requestTicket(artwork.name, artwork.type, artwork.size);
      await putToStorage(ticket, artwork, setProgress);

      setStage("Saving");
      const sortOrder = String(data.get("sortOrder") ?? "").trim();
      const result = await createBanner({
        clientName,
        targetUrl: String(data.get("targetUrl") ?? "").trim(),
        imageUrl: ticket.publicUrl,
        imageKey: ticket.objectKey,
        placement,
        edition: String(data.get("edition") ?? "") || null,
        startsAt: String(data.get("startsAt") ?? "") || null,
        expiresAt: String(data.get("expiresAt") ?? "") || null,
        sortOrder: sortOrder ? Number(sortOrder) : null,
        isActive: data.get("isActive") !== null,
      });

      if (!result.ok) throw new Error(result.error);

      formRef.current?.reset();
      clear();
      setPlacement("site_rail");
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
        the slot you picked.
      </p>

      {/* Placement leads, because it decides the size hint underneath. */}
      <div className="mt-5">
        <label htmlFor="placement" className={label}>
          Where it appears
        </label>
        <select
          id="placement"
          name="placement"
          value={placement}
          onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
          className={cn(field, "appearance-none")}
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
        <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
          {spec.hint}
          {spec.mode !== "carousel" && (
            <span className="ml-1 font-semibold text-[rgb(var(--accent-text))]">
              This slot shows every banner booked into it, so you can add as many
              as you like.
            </span>
          )}
        </p>
      </div>

      {/* ── Artwork, one file for every screen ─────────────────────────── */}
      <div className="mt-6">
        <p className={label}>
          Artwork <span className="text-[rgb(var(--accent-text))]">*</span>
        </p>
        <p className="-mt-0.5 mb-3 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
          One image is all you need. {AD_FORMATS[spec.format].hint} It is resized
          for you on upload, and the same picture is used on phones, tablets and
          desktops — only the space around it changes.
        </p>

        <UploadZone
          size={formatSize(spec.format)}
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
          </div>
        </div>

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

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-strong disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? "Uploading" : "Add banner"}
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
