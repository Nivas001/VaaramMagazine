"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { observeVisible } from "@/lib/ad-impressions";
import { CoverArt, MagazineCover } from "@/components/magazine/MagazineCover";

/** How long each cover stays fronted before the next one turns into place. */
const DWELL_MS = 4200;
/** How long the turn itself takes — quick enough to read as a page, not a slide. */
const FLIP_SECONDS = 0.68;
/** A fast lift and a controlled landing, the way an actual page settles. */
const FLIP_EASE: [number, number, number, number] = [0.5, 0, 0.14, 1];

/**
 * This week's cover standing in front of the editions before it — turning
 * through them the way a hand riffles a stack of magazines, rather than
 * sitting still.
 *
 * Only ever one destination: whichever cover is fronted is the one link, and
 * its href and label track it, so a reader who clicks always lands on the
 * edition they were looking at. With nothing published before the current
 * edition — true today, and true again after every reset — this collapses
 * back to exactly the static single cover it always was; the animation only
 * begins once there is a "before" to turn through.
 */
export function CoverFlip({
  publication,
  previous = [],
}: {
  publication: Publication;
  /** The editions before this one. Only the nearest two are used. */
  previous?: Publication[];
}) {
  const items = [publication, ...previous.slice(0, 2)];
  const reduce = useReducedMotion();
  const canTurn = items.length > 1 && !reduce;

  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => observeVisible(ref.current, setInView), []);

  useEffect(() => {
    if (!canTurn || paused || !inView) return;
    const id = setInterval(() => setFront((i) => (i + 1) % items.length), DWELL_MS);
    return () => clearInterval(id);
  }, [canTurn, paused, inView, items.length]);

  const current = items[front];
  // The other covers keep their fanned positions in their original order, so
  // only the front page visibly turns — the stack behind it holds still.
  const behind = items.filter((_, i) => i !== front).slice(0, 2);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative w-[min(76vw,380px)] sm:w-[min(44vw,420px)] lg:w-[420px]"
    >
      {behind.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {behind.map((back, i) => (
            <div
              key={back.id}
              className="page-stock absolute aspect-[3/4] overflow-hidden"
              // The stack fans back to the left, into the gutter between the
              // copy and the cover. Fanning right would push it past the band's
              // right edge, where `overflow-hidden` simply cuts it in half.
              style={{
                width: `${85 - i * 8}%`,
                left: `${-7 - i * 9}%`,
                top: `${7 + i * 5}%`,
                opacity: 0.38 - i * 0.14,
                filter: "saturate(0.5)",
              }}
            >
              <CoverArt publication={back} />
            </div>
          ))}
        </div>
      )}

      <Link
        href={`/archives/${current.slug}`}
        aria-label={`Read ${current.title}`}
        className="group relative block rounded-sm transition-transform duration-500 hover:-translate-y-2"
        style={{ perspective: 1600 }}
      >
        <div className="relative aspect-[3/4] w-full">
          <AnimatePresence initial={false}>
            <motion.div
              key={current.id}
              className="absolute inset-0"
              style={{ transformOrigin: "0% 50%" }}
              initial={canTurn ? { rotateY: 100, opacity: 0 } : false}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -100, opacity: 0 }}
              transition={{ duration: FLIP_SECONDS, ease: FLIP_EASE }}
            >
              <MagazineCover publication={current} size="fluid" priority />
            </motion.div>
          </AnimatePresence>
        </div>

        <span className="label-eyebrow mt-7 flex items-center justify-center gap-2.5 text-warm-400 transition-colors group-hover:text-gold-soft lg:justify-end">
          Open the edition
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </Link>
    </div>
  );
}
