"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Save } from "lucide-react";
import { siteConfig } from "@/site.config";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  formatSize,
  placementSpec,
  type AdBanner,
  type BannerPlacement,
} from "@/lib/types";
import { updateBanner } from "@/app/admin/actions";
import { normaliseAdArtwork } from "@/lib/image-resize";
import { UploadZone } from "./BannerForm";
import { putToStorage, requestTicket } from "./UploadToStorage";
import { cn, formatBytes } from "@/lib/utils";

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const BOOKABLE = BANNER_PLACEMENTS.filter((p) => !p.legacy);
const GROUPS = [...new Set(BOOKABLE.map((p) => p.group))];

/** A date column rendered into the value a <input type="date"> expects. */
function dateValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export function EditBannerForm({ banner }: { banner: AdBanner }) {
  const router = useRouter();

  const [placement, setPlacement] = useState<BannerPlacement>(banner.placement);
  const [clientName, setClientName] = useState(banner.client_name);
  const [targetUrl, setTargetUrl] = useState(banner.target_url ?? "");
  const [edition, setEdition] = useState(banner.edition ?? "");
  const [sortOrder, setSortOrder] = useState(String(banner.sort_order ?? 0));
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
  // The placement it was booked into may be the retired one, which is not in
  // the dropdown. Offering it keeps the select honest rather than silently
  // showing the wrong value.
  const options = useMemo(() => {
    const current = placementSpec(placement);
    return current.legacy ? [...BOOKABLE, current] : BOOKABLE;
  }, [placement]);

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

  function cancelReplacement() {
    setFile(null);
    setPreview(null);
    setReplacing(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientName.trim()) {
      setError("Enter the advertiser's name so you can identify this banner later.");
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
        const ticket = await requestTicket(
          normalised.name,
          normalised.type,
          normalised.size
        );
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
        isActive,
        ...artwork,
      });

      if (!result.ok) throw new Error(result.error);

      setSaved(true);
      cancelReplacement();
      router.refresh();
      setTimeout(() => router.push("/admin/banners"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6"
    >
      {/* ── Artwork ────────────────────────────────────────────────────── */}
      <p className={label}>Artwork</p>

      {replacing ? (
        <>
          <p className="-mt-0.5 mb-3 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            {AD_FORMATS[spec.format].hint} It is resized for you on upload.
          </p>
          <UploadZone
            size={formatSize(spec.format)}
            file={file}
            preview={preview}
            busy={busy}
            onPick={pick}
            onClear={() => {
              setFile(null);
              setPreview(null);
            }}
          />
          <button
            type="button"
            onClick={cancelReplacement}
            disabled={busy}
            className="mt-2.5 text-[13px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4 transition-colors hover:text-[rgb(var(--text))]"
          >
            Keep the current artwork
          </button>
        </>
      ) : (
        <div className="rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt={`Current artwork for ${banner.client_name}`}
            className={cn(
              "w-full rounded border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain",
              AD_FORMATS[spec.format].className
            )}
          />
          <button
            type="button"
            onClick={() => setReplacing(true)}
            disabled={busy}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-4 text-[13px] font-medium transition-colors hover:bg-[rgb(var(--surface-2))]"
          >
            <ImagePlus className="size-3.5" aria-hidden />
            Upload new artwork
          </button>
        </div>
      )}

      {/* ── Details ────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="placement" className={label}>
            Where it appears
          </label>
          <select
            id="placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
            className={cn(field, "appearance-none")}
          >
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {options
                  .filter((p) => p.group === group)
                  .map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
              </optgroup>
            ))}
            {options.some((p) => p.legacy) && (
              <optgroup label="Retired">
                {options
                  .filter((p) => p.legacy)
                  .map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
          <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
            {spec.hint}
          </p>
        </div>

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
            Link when clicked{" "}
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
              Position
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
            <p className="mt-1.5 text-[11px] leading-relaxed text-[rgb(var(--text-faint))]">
              Lower numbers come first. Type a number to move it a long way; use
              the arrows on the list for a single step.
            </p>
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
            <input
              id="startsAt"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="expiresAt" className={label}>
              Stop showing on{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">
                (optional)
              </span>
            </label>
            <input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={field}
            />
          </div>
        </div>

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
          Saved. Returning to the list.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-strong disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {busy ? "Saving" : "Save changes"}
      </button>
    </form>
  );
}
