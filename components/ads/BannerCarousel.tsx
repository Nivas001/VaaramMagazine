"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AD_FORMATS, bannerArtwork, type AdBanner, type AdFormat } from "@/lib/types";
import { observeVisible, queueImpression, trackClick } from "@/lib/ad-impressions";
import { cn, safeExternalUrl } from "@/lib/utils";

/**
 * Rotates through the banners booked for one slot, recording an impression once
 * per banner per page view and a click when a visitor follows one. Tracking is
 * fire-and-forget: a failed counter must never slow a page or surface an error.
 *
 * A slide that turns over while the strip is off screen, or in a tab nobody is
 * looking at, is not counted — the numbers here are what an advertiser is
 * billed against, so they have to mean what they claim.
 *
 * Artwork is served through <picture>, so a phone downloads only the phone
 * artwork and never pays for the desktop file. Where an advertiser supplied
 * one image, every tier resolves to it and this behaves like a plain <img>.
 */
export function BannerCarousel({
  banners,
  format = "strip",
}: {
  banners: AdBanner[];
  format?: AdFormat;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const counted = useRef<Set<string>>(new Set());
  const spec = AD_FORMATS[format];
  const current = banners[index];
  // Filtered again here: rows written before the write-side check exist.
  const href = safeExternalUrl(current?.target_url);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  useEffect(() => observeVisible(box.current, setInView), []);

  useEffect(() => {
    if (!current || !inView || counted.current.has(current.id)) return;
    counted.current.add(current.id);
    // Queued rather than sent: it leaves with the rest of the page's
    // advertisements in one request.
    queueImpression(current.id);
  }, [current, inView]);

  const art = current ? bannerArtwork(current) : null;
  if (!current || !art) return null;

  const image = (
    // Uploaded by advertisers and served straight from object storage, so
    // Next's optimiser is bypassed site-wide and <picture> is the right tool.
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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        spec.className
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

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show advertisement ${i + 1} of ${banners.length}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
