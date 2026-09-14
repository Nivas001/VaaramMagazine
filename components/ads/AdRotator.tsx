"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AD_FORMATS,
  bannerArtwork,
  bannerMs,
  type AdBanner,
  type AdFormat,
} from "@/lib/types";
import { observeVisible, queueImpression, trackClick } from "@/lib/ad-impressions";
import { cn, safeExternalUrl } from "@/lib/utils";

/**
 * One frame that takes its turn through the advertisements booked into it.
 *
 * This is the single rotating primitive on the site. A wide strip under the
 * hero is one of these; so is each of the four cards down the side of the home
 * page, and each of the towers down the other side. Nothing else rotates.
 *
 * ── What decides the timing ───────────────────────────────────────────────
 * Each banner carries its own dwell time, set per booking in the admin, so a
 * card with an address and a phone number on it can be given fifteen seconds
 * while a plain logo takes four. A banner with nothing set falls back to the
 * house default. See `bannerMs` in lib/types.ts.
 *
 * ── What is counted ───────────────────────────────────────────────────────
 * An impression is recorded once per banner per mounted frame, and only while
 * the frame is genuinely on screen. The clock does not run at all when the
 * frame is scrolled away, when the tab is in the background, or while a reader
 * is hovering it — a slide that turned over in a tab nobody was looking at is
 * not an impression, and these numbers are what an advertiser is billed
 * against.
 *
 * A frame that a breakpoint has switched off has no box, so it never
 * intersects, never rotates and never counts. That is what lets the hero
 * render its rails twice — once for wide screens, once for narrow — without
 * double counting a single view.
 */
export function AdRotator({
  banners,
  format = "strip",
  /** Staggers sibling frames so a rail does not turn over all at once. */
  offsetMs = 0,
  controls = "auto",
  className,
}: {
  banners: AdBanner[];
  format?: AdFormat;
  offsetMs?: number;
  /** "auto" shows position dots once a frame holds more than one booking. */
  controls?: "auto" | "none";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const counted = useRef<Set<string>>(new Set());

  const spec = AD_FORMATS[format];
  const current = banners[index % Math.max(1, banners.length)];
  // Filtered again here: rows written before the write-side check exist.
  const href = safeExternalUrl(current?.target_url);

  useEffect(() => observeVisible(box.current, setInView), []);

  // The turn itself. A timeout rather than an interval, because every banner
  // may ask for a different length of time on screen.
  useEffect(() => {
    if (banners.length < 2 || paused || !inView || !current) return;
    const wait = bannerMs(current) + (index === 0 ? offsetMs : 0);
    const id = setTimeout(() => setIndex((i) => (i + 1) % banners.length), wait);
    return () => clearTimeout(id);
  }, [banners.length, paused, inView, current, index, offsetMs]);

  useEffect(() => {
    if (!current || !inView || counted.current.has(current.id)) return;
    counted.current.add(current.id);
    // Queued rather than sent: it leaves with the rest of the page's
    // advertisements in one request.
    queueImpression(current.id);
  }, [current, inView]);

  const art = current ? bannerArtwork(current) : null;
  if (!current || !art) return null;

  const showDots = controls === "auto" && banners.length > 1;

  const image = (
    // Uploaded by advertisers and served straight from object storage, so
    // Next's optimiser is bypassed site-wide and <picture> is the right tool.
    // Where one image was supplied every source resolves to it, and this
    // behaves as a plain <img>.
    <picture className="block size-full">
      <source media="(min-width: 1024px)" srcSet={art.desktop} />
      <source media="(min-width: 640px)" srcSet={art.tablet} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.mobile}
        alt={`Advertisement by ${current.client_name}`}
        width={spec.width}
        height={spec.height}
        loading="lazy"
        decoding="async"
        // `contain`, not `cover`: an advertiser paid for this artwork, and
        // cropping a phone number off the edge of it is a worse failure than
        // showing a band of background beside a wrongly-sized image.
        className="size-full object-contain"
      />
    </picture>
  );

  return (
    <div
      ref={box}
      data-ad-rotator
      data-ad-id={current.id}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        spec.className,
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.45 }}
          className="absolute inset-0"
        >
          {href ? (
            <a
              href={href}
              target="_blank"
              // `sponsored` tells search engines this is a paid link.
              rel="noopener noreferrer sponsored"
              onClick={() => trackClick(current.id)}
              className="block size-full"
            >
              {image}
            </a>
          ) : (
            image
          )}
        </motion.div>
      </AnimatePresence>

      {showDots && (
        <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5 px-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show advertisement ${i + 1} of ${banners.length}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.18)] transition-all duration-300",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Several rotating frames sharing one running order.
 *
 * The bookings are dealt round-robin rather than in blocks, which is what
 * makes the administrator's ordering mean what they expect: with four frames,
 * the first four advertisements in the list are the four on screen when the
 * page opens, and everything after them cycles in behind. Dealt in blocks
 * instead, banners five to eight would never be seen first by anybody.
 *
 * Frames are staggered by a second and a bit each, so a rail of four does not
 * blink over all at once.
 */
export function AdRotatorStack({
  banners,
  format = "card",
  slots = 1,
  gap = "gap-4",
  className,
  frameClassName,
  controls = "auto",
}: {
  banners: AdBanner[];
  format?: AdFormat;
  slots?: number;
  gap?: string;
  className?: string;
  frameClassName?: string;
  controls?: "auto" | "none";
}) {
  const frames = useMemo(() => deal(banners, slots), [banners, slots]);
  if (frames.length === 0) return null;

  return (
    <div className={cn("flex flex-col", gap, className)}>
      {frames.map((group, i) => (
        <AdRotator
          key={group[0].id}
          banners={group}
          format={format}
          offsetMs={i * 1200}
          controls={controls}
          className={frameClassName}
        />
      ))}
    </div>
  );
}

/** Round-robin, dropping any frame that ended up with nothing in it. */
export function deal(banners: AdBanner[], slots: number): AdBanner[][] {
  const count = Math.max(1, Math.min(slots, banners.length));
  const out: AdBanner[][] = Array.from({ length: count }, () => []);
  banners.forEach((banner, i) => out[i % count].push(banner));
  return out.filter((group) => group.length > 0);
}
