"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { observeVisible } from "@/lib/ad-impressions";
import { renderPdfPages, type RenderedPage } from "@/lib/pdf-pages";
import { CoverArt } from "@/components/magazine/MagazineCover";

/** How many opening pages are worth showing before the loop repeats. */
const MAX_PAGES = 6;
/** How long a page is held before the next one turns. */
const DWELL_MS = 3200;
/**
 * How long the turn itself takes. Matched to the e-paper readers this was
 * modelled on, which all land near eight tenths of a second — fast enough to
 * feel like paper, slow enough to read as a turn rather than a cut.
 */
const TURN_SECONDS = 0.8;
/** Accelerate off the spine, settle onto the stack. */
const TURN_EASE: [number, number, number, number] = [0.645, 0.045, 0.355, 1];

/**
 * This week's edition, turning its own pages.
 *
 * The hero used to show a still cover. It now opens the current edition and
 * flips through the first few pages of it — the publication demonstrating
 * what it is rather than describing it. Only ever this week's edition: the
 * back issues have their own place further down the page.
 *
 * How it behaves, in order of what a visitor actually experiences:
 *
 *  1. The cover paints immediately, from the same image the archive uses. It
 *     is the hero's largest element, so it must not wait on a PDF.
 *  2. Once the hero is genuinely on screen and the browser is idle, the
 *     edition's opening pages are rasterised in the background.
 *  3. The moment two pages exist, the turning starts and continues as the
 *     rest arrive.
 *
 * If any of that fails — an offline visitor, a PDF that will not parse, a
 * browser without the APIs — the cover simply stays, which is exactly the
 * design this replaced. Nothing is surfaced to the reader.
 */
export function EditionFlip({ publication }: { publication: Publication }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [current, setCurrent] = useState(0);
  /** The page rotating away, if one is mid-turn. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => observeVisible(ref.current, setInView), []);

  /* ── Rasterise the opening pages, once, after the hero is seen ───────── */
  useEffect(() => {
    // Reduced motion gets the cover and nothing else: there would be no
    // turning to justify the work.
    if (reduce || !inView || !publication.pdf_url) return;

    const controller = new AbortController();
    let rendered: RenderedPage[] = [];

    const start = () => {
      void renderPdfPages(publication.pdf_url, {
        maxPages: MAX_PAGES,
        signal: controller.signal,
        onPage: (page) => {
          rendered.push(page);
          if (!controller.signal.aborted) setPages((prev) => [...prev, page]);
        },
      });
    };

    // Wait for a quiet moment so rasterising never competes with the rest of
    // the home page painting.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 600);

    return () => {
      controller.abort();
      if (window.cancelIdleCallback && typeof idle === "number") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle as number);
      for (const page of rendered) URL.revokeObjectURL(page.url);
      rendered = [];
    };
  }, [publication.pdf_url, inView, reduce]);

  /* ── Turn a page every few seconds ──────────────────────────────────── */
  const canTurn = pages.length > 1 && !reduce;

  useEffect(() => {
    if (!canTurn || paused || !inView) return;
    const id = setTimeout(() => {
      setLeaving(current);
      setCurrent((i) => (i + 1) % pages.length);
    }, DWELL_MS);
    return () => clearTimeout(id);
  }, [canTurn, paused, inView, current, pages.length]);

  const showPages = pages.length > 0;
  // Until the PDF has been measured the box keeps the cover's proportion, so
  // nothing jumps when the pages arrive.
  const ratio = pages[0] ? `${pages[0].width} / ${pages[0].height}` : "3 / 4";

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative w-[min(76vw,380px)] sm:w-[min(44vw,420px)] lg:w-[420px]"
    >
      <Link
        href={`/archives/${publication.slug}`}
        aria-label={`Read ${publication.title}`}
        className="group relative block rounded-sm transition-transform duration-500 hover:-translate-y-2"
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: ratio, perspective: "2000px" }}
        >
          {/* The block of paper the pages are turning off. Thickness only —
              this is the edition's own body, not another issue. */}
          <div
            className="page-stack absolute inset-y-[1.5%] left-[1.5%] right-[-2.2%] shadow-[0_20px_50px_-24px_rgba(20,16,12,0.5)]"
            aria-hidden
          />
          <div className="page-stack absolute inset-y-[0.8%] left-[0.8%] right-[-1.1%] opacity-90" aria-hidden />

          {/* The page facing the reader. */}
          <div className="page-stock absolute inset-0 z-10">
            {showPages ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pages[current].url}
                alt={`Page ${current + 1} of ${publication.title}`}
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <CoverArt publication={publication} priority />
            )}
          </div>

          {/* The leaf turning away from it. Mounted only while it turns. */}
          {leaving !== null && pages[leaving] && (
            <motion.div
              key={leaving}
              aria-hidden
              className="page-stock absolute inset-0 z-20"
              style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: -178 }}
              transition={{ duration: TURN_SECONDS, ease: TURN_EASE }}
              onAnimationComplete={() => setLeaving(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pages[leaving].url}
                alt=""
                className="size-full object-cover"
                draggable={false}
              />
              {/* Light falling off the sheet as it lifts. Without this the
                  page vanishes at ninety degrees rather than turning. */}
              <motion.div
                className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-black/25 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: TURN_SECONDS * 0.6, ease: "easeIn" }}
              />
            </motion.div>
          )}
        </div>

        <span className="label-eyebrow mt-7 flex items-center justify-center gap-2.5 text-warm-400 transition-colors group-hover:text-gold-soft lg:justify-end">
          {showPages ? `Page ${current + 1} · Open the edition` : "Open the edition"}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </Link>
    </div>
  );
}
