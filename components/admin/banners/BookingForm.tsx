"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { siteConfig } from "@/site.config";
import {
  AD_FORMATS,
  DEFAULT_ROTATE_SECONDS,
  MAX_ROTATE_SECONDS,
  MIN_ROTATE_SECONDS,
  formatSize,
  placementSpec,
  type AdBanner,
  type AdFormat,
  type BannerPlacement,
} from "@/lib/types";
import {
  SITE_PAGES,
  VALUE_LABELS,
  capacityLabel,
  placementGuide,
  placementsOnPage,
} from "@/lib/placement-guide";
import { createBanner, createBannerBatch } from "@/app/admin/actions";
import { normaliseAdArtwork } from "@/lib/image-resize";
import { putToStorage, requestTicket } from "@/components/admin/UploadToStorage";
import { UploadZone, artworkProblem } from "./UploadZone";
import { SlotPreview, fillMap } from "./SlotPreview";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BOOKING AN ADVERTISEMENT
 *
 *  Five numbered steps down the page and a picture of the website beside them
 *  that updates as the form is filled in. Nothing is hidden behind a "next"
 *  button: the whole booking is on one screen, so an administrator can check
 *  it the way they would check a paper order form — top to bottom, once.
 *
 *  The step that used to go wrong was the first one. A dropdown of names like
 *  "Home — mid page" gives no sense of what is being sold or whether it is
 *  already taken, so this asks for the slot as a set of cards that each say
 *  where it is, what shape the artwork must be, and whether anything is free.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function BookingForm({
  banners,
  initialPlacement,
}: {
  banners: AdBanner[];
  /** Arrives from "Book this slot" on the inventory map. */
  initialPlacement?: BannerPlacement;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [placement, setPlacement] = useState<BannerPlacement>(
    initialPlacement ?? "site_rail"
  );
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Set<BannerPlacement>>(new Set());

  // Keyed by shape, not by a single file: a card and a strip are different
  // proportions, so a booking spanning both needs artwork drawn for each.
  const [filesByFormat, setFilesByFormat] = useState<Partial<Record<AdFormat, File>>>({});
  const [previewsByFormat, setPreviewsByFormat] = useState<Partial<Record<AdFormat, string>>>({});

  const [clientName, setClientName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const fills = useMemo(() => fillMap(banners), [banners]);
  const spec = useMemo(() => placementSpec(placement), [placement]);

  const activePlacements = useMemo(
    () => (multi ? [...selected] : [placement]),
    [multi, selected, placement]
  );
  const anyCarousel = activePlacements.some((p) => placementSpec(p).mode === "carousel");
  const neededFormats = useMemo(() => {
    const set = new Set(activePlacements.map((p) => placementSpec(p).format));
    return set.size > 0 ? [...set] : (["card"] as AdFormat[]);
  }, [activePlacements]);

  /** The slot the preview draws. In multi mode, the first one checked. */
  const previewPlacement = multi ? ([...selected][0] ?? placement) : placement;
  const previewFormat = placementSpec(previewPlacement).format;

  // Object URLs are handed back when the component goes, or a long session of
  // swapping artwork quietly holds every image it ever previewed in memory.
  useEffect(() => {
    return () => {
      for (const url of Object.values(previewsByFormat)) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFor(format: AdFormat, incoming: File | null) {
    setError(null);
    if (!incoming) return;

    const problem = artworkProblem(incoming);
    if (problem) {
      setError(problem);
      return;
    }

    setFilesByFormat((prev) => ({ ...prev, [format]: incoming }));
    setPreviewsByFormat((prev) => {
      if (prev[format]) URL.revokeObjectURL(prev[format]);
      return { ...prev, [format]: URL.createObjectURL(incoming) };
    });
  }

  function clearFor(format: AdFormat) {
    setFilesByFormat((prev) => {
      const next = { ...prev };
      delete next[format];
      return next;
    });
    setPreviewsByFormat((prev) => {
      if (prev[format]) URL.revokeObjectURL(prev[format]);
      const next = { ...prev };
      delete next[format];
      return next;
    });
  }

  function toggleMulti() {
    if (multi) {
      setPlacement([...selected][0] ?? placement);
      setMulti(false);
    } else {
      setSelected(new Set([placement]));
      setMulti(true);
    }
  }

  function runFor(months: number | null) {
    const from = new Date();
    setStartsAt(iso(from));
    if (months === null) {
      setExpiresAt("");
      return;
    }
    const to = new Date(from);
    to.setMonth(to.getMonth() + months);
    setExpiresAt(iso(to));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (multi && selected.size === 0) {
      setError("Choose at least one place for this advertisement to appear.");
      return;
    }
    if (!clientName.trim()) {
      setError("Enter the advertiser's name so you can find this booking later.");
      return;
    }
    const missing = neededFormats.filter((f) => !filesByFormat[f]);
    if (missing.length > 0) {
      setError(
        neededFormats.length > 1
          ? `Still needs artwork for: ${missing.map((f) => AD_FORMATS[f].label).join(", ")}.`
          : "Choose the artwork for this advertisement."
      );
      return;
    }
    if (startsAt && expiresAt && expiresAt < startsAt) {
      setError("The end date is before the start date — swap them round.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const targetUrl = String(data.get("targetUrl") ?? "").trim();
    const edition = String(data.get("edition") ?? "") || null;
    const sortOrderRaw = String(data.get("sortOrder") ?? "").trim();
    const rotateSecondsRaw = String(data.get("rotateSeconds") ?? "").trim();
    const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : null;
    const rotateSeconds = rotateSecondsRaw ? Number(rotateSecondsRaw) : null;
    const isActive = data.get("isActive") !== null;

    setBusy(true);
    setError(null);
    setDone(null);
    setProgress(0);

    try {
      // One upload per *shape* needed — two placements that both take a card
      // share a single upload.
      const artworkByFormat: Partial<
        Record<AdFormat, { imageUrl: string; imageKey: string }>
      > = {};

      for (let i = 0; i < neededFormats.length; i += 1) {
        const format = neededFormats[i];
        const source = filesByFormat[format];
        if (!source) continue;
        const tag =
          neededFormats.length > 1
            ? ` (${AD_FORMATS[format].label}, ${i + 1} of ${neededFormats.length})`
            : "";
        setStage(`Preparing artwork${tag}`);
        const resized = await normaliseAdArtwork(source, format);
        setStage(`Uploading artwork${tag}`);
        const ticket = await requestTicket(resized.name, resized.type, resized.size);
        await putToStorage(ticket, resized, setProgress);
        artworkByFormat[format] = {
          imageUrl: ticket.publicUrl,
          imageKey: ticket.objectKey,
        };
      }

      setStage("Saving");

      if (multi) {
        const result = await createBannerBatch({
          clientName: clientName.trim(),
          targetUrl,
          edition,
          startsAt: startsAt || null,
          expiresAt: expiresAt || null,
          isActive,
          sortOrder,
          rotateSeconds,
          placements: [...selected],
          artworkByFormat: artworkByFormat as Record<
            string,
            { imageUrl: string; imageKey: string }
          >,
        });
        if (!result.ok) throw new Error(result.error);
        setDone(
          `Booked into ${result.created} placement${result.created === 1 ? "" : "s"}. It is on the website now.`
        );
      } else {
        const artwork = artworkByFormat[spec.format];
        if (!artwork) throw new Error("Choose the artwork for this advertisement.");

        const result = await createBanner({
          clientName: clientName.trim(),
          targetUrl,
          imageUrl: artwork.imageUrl,
          imageKey: artwork.imageKey,
          placement,
          edition,
          startsAt: startsAt || null,
          expiresAt: expiresAt || null,
          sortOrder,
          rotateSeconds,
          isActive,
        });
        if (!result.ok) throw new Error(result.error);
        setDone(
          isActive
            ? `${clientName.trim()} is now live in ${spec.label}.`
            : `${clientName.trim()} is saved, paused, and ready to switch on.`
        );
      }

      formRef.current?.reset();
      setClientName("");
      setStartsAt("");
      setExpiresAt("");
      for (const url of Object.values(previewsByFormat)) URL.revokeObjectURL(url);
      setFilesByFormat({});
      setPreviewsByFormat({});
      setSelected(new Set());
      setMulti(false);
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the booking.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-8">
      {done && (
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="size-4 shrink-0" />
          {done}
          <Link
            href="/admin/banners"
            className="font-semibold underline underline-offset-4"
          >
            Back to all ads
          </Link>
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        <div className="min-w-0 space-y-8">
          {/* ── 1. Where ─────────────────────────────────────────────────── */}
          <Step
            n={1}
            title="Where should it appear?"
            lead="Pick a space on the website. The picture beside this shows exactly where it lands."
            action={
              <button
                type="button"
                onClick={toggleMulti}
                className="text-[12.5px] font-semibold text-[rgb(var(--accent-text))] underline decoration-[rgb(var(--accent))]/40 underline-offset-4 hover:decoration-[rgb(var(--accent))]"
              >
                {multi ? "Just one place" : "Put it in several places"}
              </button>
            }
          >
            <div className="space-y-6">
              {SITE_PAGES.map((page) => {
                const slots = placementsOnPage(page.key);
                if (slots.length === 0) return null;

                return (
                  <div key={page.key}>
                    <p className="label-eyebrow mb-2.5 text-[10px] text-[rgb(var(--text-faint))]">
                      {page.label}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {slots.map((p) => {
                        const fill = fills[p.value];
                        const guide = placementGuide(p.value);
                        const checked = multi
                          ? selected.has(p.value)
                          : placement === p.value;

                        return (
                          <label
                            key={p.value}
                            className={cn(
                              "flex cursor-pointer gap-3 rounded-lg border p-3.5 transition-colors",
                              checked
                                ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/7"
                                : "border-[rgb(var(--hairline))] hover:border-[rgb(var(--text-faint))]"
                            )}
                          >
                            <input
                              type={multi ? "checkbox" : "radio"}
                              name={multi ? undefined : "placement"}
                              value={p.value}
                              checked={checked}
                              onChange={(e) => {
                                if (multi) {
                                  setSelected((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(p.value);
                                    else next.delete(p.value);
                                    return next;
                                  });
                                } else {
                                  setPlacement(p.value);
                                }
                              }}
                              className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--accent))]"
                            />
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[13.5px] font-semibold">{p.label}</span>
                                {guide.value !== "standard" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[rgb(var(--label))]">
                                    <Sparkles className="size-2.5" aria-hidden />
                                    {VALUE_LABELS[guide.value]}
                                  </span>
                                )}
                              </span>
                              <span
                                className={cn(
                                  "mt-1 block text-[12px] font-semibold",
                                  fill?.state === "empty"
                                    ? "text-[rgb(var(--accent-text))]"
                                    : "text-[rgb(var(--text-faint))]"
                                )}
                              >
                                {fill?.summary}
                              </span>
                              <span className="mt-1 block text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                                {AD_FORMATS[p.format].label} · {formatSize(p.format)}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-md bg-[rgb(var(--surface-2))] px-4 py-3 text-[12.5px] leading-relaxed text-[rgb(var(--text-muted))]">
              {multi ? (
                selected.size === 0 ? (
                  "Tick every space this advertiser has paid for."
                ) : (
                  <>
                    This makes {selected.size} separate booking
                    {selected.size > 1 ? "s" : ""} — one per space — so any one of
                    them can be moved, paused or removed later without touching the
                    others.
                  </>
                )
              ) : (
                <>
                  {placementGuide(placement).where}{" "}
                  <span className="font-semibold text-[rgb(var(--text))]">
                    {capacityLabel(placement)}.
                  </span>
                </>
              )}
            </p>
          </Step>

          {/* ── 2. Artwork ──────────────────────────────────────────────── */}
          <Step
            n={2}
            title={
              neededFormats.length > 1
                ? `The artwork — ${neededFormats.length} shapes needed`
                : "The artwork"
            }
            lead={
              neededFormats.length > 1
                ? "The spaces you ticked are different shapes, so each needs its own image. One photo stretched into all of them would leave the wide one mostly empty."
                : "One image is all you need — it is resized for you, and the same picture is used on phones, tablets and desktops."
            }
          >
            <div className="space-y-4">
              {neededFormats.map((format) => (
                <div key={format}>
                  {neededFormats.length > 1 && (
                    <p className="mb-1.5 text-[12.5px] font-semibold">
                      {AD_FORMATS[format].label} artwork
                    </p>
                  )}
                  <p className="mb-2 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                    {AD_FORMATS[format].hint}
                  </p>
                  <UploadZone
                    title={`${AD_FORMATS[format].label} image`}
                    size={formatSize(format)}
                    file={filesByFormat[format] ?? null}
                    preview={previewsByFormat[format] ?? null}
                    busy={busy}
                    onPick={(f) => pickFor(format, f)}
                    onClear={() => clearFor(format)}
                  />
                </div>
              ))}
            </div>
          </Step>

          {/* ── 3. Who ──────────────────────────────────────────────────── */}
          <Step
            n={3}
            title="Who is it for?"
            lead="The advertiser's name is only ever shown to you — it is how you will find this booking again."
          >
            <div className="grid gap-4">
              <div>
                <label htmlFor="clientName" className={label}>
                  Advertiser name <span className="text-[rgb(var(--accent-text))]">*</span>
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  maxLength={160}
                  className={field}
                  placeholder="e.g. Sri Balaji Motors"
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
                  name="targetUrl"
                  type="url"
                  className={field}
                  placeholder="https://example.com"
                />
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                  Leave it blank and the advertisement still shows, it just is not
                  clickable. Clicks are counted for you either way.
                </p>
              </div>
            </div>
          </Step>

          {/* ── 4. When ─────────────────────────────────────────────────── */}
          <Step
            n={4}
            title="When does it run?"
            lead="Leave both dates blank and it runs until you stop it. Setting an end date is how the desk warns you before a booking runs out."
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { label: "One month", months: 1 },
                { label: "Three months", months: 3 },
                { label: "Six months", months: 6 },
                { label: "No end date", months: null },
              ].map(({ label: text, months }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => runFor(months)}
                  className="inline-flex h-9 cursor-pointer items-center rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[12.5px] font-semibold text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--accent))]/50 hover:text-[rgb(var(--text))]"
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startsAt" className={label}>
                  Start showing on
                </label>
                <input
                  id="startsAt"
                  name="startsAt"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className={field}
                />
                <p className="mt-1.5 text-[11.5px] text-[rgb(var(--text-faint))]">
                  Blank means straight away.
                </p>
              </div>
              <div>
                <label htmlFor="expiresAt" className={label}>
                  Stop showing after
                </label>
                <input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={field}
                />
                <p className="mt-1.5 text-[11.5px] text-[rgb(var(--text-faint))]">
                  It runs to the end of that day. Blank means it never stops.
                </p>
              </div>
            </div>

            <details className="mt-4 rounded-md border border-[rgb(var(--hairline))] p-4">
              <summary className="cursor-pointer text-[13px] font-semibold">
                Finer control — order, edition, time on screen
              </summary>

              <div className="mt-4 grid gap-4">
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
                      name="sortOrder"
                      type="number"
                      min={0}
                      step={10}
                      className={field}
                      placeholder="Added to the end"
                    />
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                      Lower numbers come first. Leave it blank and it joins the end
                      of the queue, which is almost always what you want.
                    </p>
                  </div>
                </div>

                {anyCarousel && (
                  <div>
                    <label htmlFor="rotateSeconds" className={label}>
                      Seconds on screen
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
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-[rgb(var(--text-faint))]">
                      How long this one holds its frame before the next takes over,
                      where advertisements take turns. Give one carrying an address
                      or a phone number longer — anything from {MIN_ROTATE_SECONDS}{" "}
                      to {MAX_ROTATE_SECONDS}.
                    </p>
                  </div>
                )}
              </div>
            </details>
          </Step>

          {/* ── 5. Publish ──────────────────────────────────────────────── */}
          <Step
            n={5}
            title="Put it on the website"
            lead="Everything above can still be changed afterwards — including the artwork."
          >
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="mt-0.5 size-4 accent-[rgb(var(--accent))]"
              />
              <span>
                Show it on the website straight away
                <span className="mt-0.5 block text-[12px] text-[rgb(var(--text-faint))]">
                  Untick to save it paused — useful when the artwork is approved but
                  the invoice is not paid yet.
                </span>
              </span>
            </label>

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

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || (multi && selected.size === 0)}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {busy
                  ? "Uploading"
                  : multi
                    ? `Book ${selected.size || 0} space${selected.size === 1 ? "" : "s"}`
                    : "Book this ad"}
              </button>

              <Link
                href="/admin/banners"
                className="text-[13px] font-semibold text-[rgb(var(--text-muted))] underline underline-offset-4 hover:text-[rgb(var(--text))]"
              >
                Cancel
              </Link>
            </div>
          </Step>
        </div>

        {/* ── The website, as it will look ───────────────────────────────── */}
        <aside className="lg:sticky lg:top-40">
          <div className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-5">
            <h2 className="font-display text-lg tracking-[-0.02em]">
              Where it will appear
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[rgb(var(--text-muted))]">
              {previewsByFormat[previewFormat]
                ? "Your artwork, drawn into the page where a reader will meet it."
                : "Choose the artwork above and it appears here, in position."}
            </p>

            <div className="mt-4">
              <SlotPreview
                placement={previewPlacement}
                banners={banners}
                pending={
                  previewsByFormat[previewFormat]
                    ? {
                        imageUrl: previewsByFormat[previewFormat] as string,
                        clientName: clientName || "This booking",
                      }
                    : null
                }
              />
            </div>

            {multi && selected.size > 1 && (
              <p className="mt-4 rounded-md bg-[rgb(var(--surface-2))] px-3.5 py-2.5 text-[12px] leading-relaxed text-[rgb(var(--text-muted))]">
                Showing the first of {selected.size} spaces. The others are booked
                with the same details and their own artwork shape.
              </p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}

/** A numbered section of the booking form. */
function Step({
  n,
  title,
  lead,
  action,
  children,
}: {
  n: number;
  title: string;
  lead?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[rgb(var(--accent))]/12 font-display text-[13px] font-bold text-[rgb(var(--accent-text))]">
            {n}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg tracking-[-0.02em]">{title}</h2>
            {lead && (
              <p className="mt-1 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">
                {lead}
              </p>
            )}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** A Date as the "YYYY-MM-DD" an <input type="date"> expects. */
function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}
