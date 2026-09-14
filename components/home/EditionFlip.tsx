"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { cn } from "@/lib/utils";
import { observeVisible } from "@/lib/ad-impressions";
import { PdfBook } from "@/lib/pdf-book";
import { BookLeaf, type LeafHandle } from "@/components/reader/BookLeaf";
import { CoverArt } from "@/components/magazine/MagazineCover";

/**
 * This week's edition, lying open and turning its own pages.
 *
 * The hero used to show a still cover. It now opens the current edition as a
 * spread and turns through it with the same hinged, bending sheet the reader
 * uses — the publication demonstrating what it is instead of describing it,
 * and a promise that the reader on the other side of the button behaves the
 * same way.
 *
 * What a visitor actually experiences, in order:
 *
 *  1. The cover paints immediately, from the image the archive already has.
 *     It is the hero's largest element and must never wait on a PDF.
 *  2. Once the hero is genuinely on screen and the browser is idle, the
 *     opening pages are rasterised in the background, a few hundred kilobytes
 *     of byte ranges rather than the whole edition.
 *  3. The moment there are enough pages to make a spread, the book opens and
 *     starts turning, and keeps going as the rest arrive.
 *
 * Every one of those steps is allowed to fail silently. An offline visitor, a
 * PDF that will not parse, a browser without the APIs — all of them simply
 * keep the cover that was already there, which is the design this replaced.
 */

/** How many opening pages are worth showing before the loop repeats. */
const MAX_PAGES = 8;
/** How long a spread is held before the next sheet turns. */
const DWELL_MS = 3600;
const TURN_MS = 900;
/** Below this the two halves of a spread are too small to read as pages. */
const SPREAD_MIN = 640;

export function EditionFlip({ publication }: { publication: Publication }) {
  const ref = useRef<HTMLDivElement>(null);
  const leafRef = useRef<LeafHandle>(null);
  const rafRef = useRef(0);

  const [pages, setPages] = useState<(string | null)[]>([]);
  const [ratio, setRatio] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState<{ key: number; front: string | null; back: string | null } | null>(
    null
  );
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [spread, setSpread] = useState(true);
  const [reduce, setReduce] = useState(false);

  useEffect(() => observeVisible(ref.current, setInView), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia(`(min-width: ${SPREAD_MIN}px)`);
    const sync = () => {
      setReduce(motion.matches);
      setSpread(wide.matches);
    };
    sync();
    motion.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  /* ── Rasterise the opening pages, once, after the hero is seen ─────────── */
  useEffect(() => {
    if (reduce || !inView || !publication.pdf_url) return;

    let book: PdfBook | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        book = await PdfBook.open(publication.pdf_url);
        if (cancelled) {
          book.destroy();
          return;
        }
        const size = await book.pageSize(1);
        if (!cancelled) setRatio(size.width / size.height);

        const count = Math.min(book.numPages, MAX_PAGES);
        for (let n = 1; n <= count; n++) {
          const image = await book.getPage(n, 460);
          if (cancelled) return;
          // Handed over one at a time, so the book can open on the first
          // spread while the rest of the pages are still being drawn.
          setPages((previous) => {
            const next = [...previous];
            next[n - 1] = image?.url ?? null;
            return next;
          });
        }
      } catch {
        /* The cover stays. Nothing is surfaced to the reader. */
      }
    };

    // Wait for a quiet moment: rasterising must never compete with the rest of
    // the home page painting.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => void start(), { timeout: 2500 })
      : window.setTimeout(() => void start(), 600);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle as number);
      // Destroying the document revokes every object URL it handed out, so
      // the images are released with it.
      book?.destroy();
      setPages([]);
    };
  }, [publication.pdf_url, inView, reduce]);

  /* ── Pagination, the same model the reader uses ───────────────────────── */

  const loaded = pages.filter(Boolean).length;
  const pageAt = useCallback((n: number) => (n >= 1 ? (pages[n - 1] ?? null) : null), [pages]);
  const leftOf = useCallback(
    (i: number) => (spread && i > 0 ? pageAt(i * 2) : null),
    [spread, pageAt]
  );
  const rightOf = useCallback(
    (i: number) => pageAt(spread ? i * 2 + 1 : i + 1),
    [spread, pageAt]
  );

  /**
   * A sheet can only turn once every page the turn touches has arrived: the
   * face going away, the face coming down, and the half revealed behind it.
   */
  const canTurn =
    (rightOf(index) !== null || (index === 0 && Boolean(publication.cover_url))) &&
    rightOf(index + 1) !== null &&
    (!spread || leftOf(index + 1) !== null);

  /* ── Turn a sheet every few seconds ───────────────────────────────────── */

  useEffect(() => {
    if (reduce || paused || !inView || loaded < 2 || turning) return;

    const id = window.setTimeout(() => {
      if (!canTurn) {
        // Nothing turns backwards on a loop: the book simply closes and opens
        // again, which reads as "a new edition" rather than as a rewind.
        setIndex(0);
        return;
      }

      const sheet = {
        key: Date.now(),
        front: rightOf(index) || (index === 0 ? publication.cover_url || null : null),
        back: spread ? leftOf(index + 1) : null,
      };
      setTurning(sheet);

      requestAnimationFrame(() => {
        leafRef.current?.setProgress(0);
        const started = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - started) / TURN_MS);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          leafRef.current?.setProgress(eased);
          if (t < 1) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            setIndex((i) => i + 1);
            setTurning(null);
          }
        };
        rafRef.current = requestAnimationFrame(step);
      });
    }, DWELL_MS);

    return () => window.clearTimeout(id);
  }, [reduce, paused, inView, loaded, turning, index, canTurn, rightOf, leftOf, spread]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* Switching between one page and two must never land on a missing spread. */
  useEffect(() => setIndex(0), [spread]);

  // While a sheet is in the air the halves underneath already show where the
  // turn is going, so it never sweeps over a blank.
  const shownLeft = leftOf(index);
  const coverImage = publication.cover_url || null;
  const currentRight = rightOf(index) || (index === 0 ? coverImage : null);
  const nextRight = rightOf(index + 1);
  const shownRight = turning ? nextRight : currentRight;
  const shownPage = spread ? (leftOf(index) ? index * 2 : 1) : index + 1;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={
        spread
          ? "relative w-full max-w-[560px] 2xl:max-w-[580px]"
          : "relative w-full max-w-[360px] sm:max-w-[400px]"
      }
    >
      <Link
        href={`/archives/${publication.slug}`}
        aria-label={`Read ${publication.title}`}
        className="group relative block rounded-sm transition-transform duration-500 hover:-translate-y-2"
      >
        <div
          className="relative flex"
          style={{
            aspectRatio: `${(spread ? 2 : 1) * (ratio ?? 0.75)} / 1`,
            perspective: "2200px",
            perspectiveOrigin: "50% 42%",
            transformStyle: "preserve-3d",
          }}
        >
          {spread && <Half src={shownLeft} side="left" />}
          <Half
            src={shownRight}
            side={spread ? "right" : "only"}
            fallback={<CoverArt publication={publication} priority />}
          />

          {spread && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[9%] -translate-x-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.2) 36%, rgba(0,0,0,0.34) 50%, rgba(0,0,0,0.2) 64%, transparent)",
              }}
            />
          )}

          {turning && (
            <div
              className="absolute top-0 h-full"
              style={{
                width: spread ? "50%" : "100%",
                left: spread ? "50%" : 0,
                transformStyle: "preserve-3d",
                zIndex: 20,
              }}
            >
              <BookLeaf
                key={turning.key}
                ref={leafRef}
                front={turning.front}
                back={turning.back}
                segments={9}
              />
            </div>
          )}
        </div>

        <span className="label-eyebrow mt-7 flex items-center justify-center gap-2.5 text-warm-400 transition-colors group-hover:text-gold-soft lg:justify-end">
          {index === 0
            ? "Open the edition"
            : spread
              ? `Page ${shownPage}–${shownPage + 1} · Open the edition`
              : `Page ${shownPage} · Open the edition`}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </Link>
    </div>
  );
}

/** One half of the open spread. */
function Half({
  src,
  side,
  fallback,
}: {
  src: string | null;
  side: "left" | "right" | "only";
  fallback?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative h-full flex-none overflow-hidden",
        side === "left" && !src ? "bg-[#f8f6f2]" : "bg-white"
      )}
      style={{
        width: side === "only" ? "100%" : "50%",
        borderRadius:
          side === "left" ? "3px 0 0 3px" : side === "right" ? "0 3px 3px 0" : "2px 4px 4px 2px",
        boxShadow: "0 2px 6px rgba(20,16,12,0.3), 0 30px 60px -28px rgba(20,16,12,0.75)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" draggable={false} />
      ) : side === "left" ? (
        <div className="flex size-full flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
          <div
            className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent"
            aria-hidden
          />
          <span className="font-serif italic text-xs tracking-wider text-warm-400/40">
            Vaaram Magazine
          </span>
        </div>
      ) : (
        fallback ?? null
      )}
    </div>
  );
}
