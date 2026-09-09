"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  SHAPE_SPECS,
  bannerArtwork,
  type AdBanner,
  type BannerShape,
} from "@/lib/types";
import { cn, safeExternalUrl } from "@/lib/utils";

/**
 * Rotates through the banners booked for one slot, recording an impression once
 * per banner per page view and a click when a visitor follows one. Tracking is
 * fire-and-forget: a failed counter must never slow a page or surface an error.
 *
 * Artwork is served through <picture>, so a phone downloads only the phone
 * artwork and never pays for the desktop file. Where an advertiser supplied
 * one image, every tier resolves to it and this behaves like a plain <img>.
 */
export function BannerCarousel({
  banners,
  shape = "banner",
}: {
  banners: AdBanner[];
  shape?: BannerShape;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const counted = useRef<Set<string>>(new Set());
  const current = banners[index];
  // Filtered again here: rows written before the write-side check exist.
  const href = safeExternalUrl(current?.target_url);

  useEffect(() => {
    if (banners.length < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(id);
  }, [banners.length, paused]);

  useEffect(() => {
    if (!current || counted.current.has(current.id)) return;
    counted.current.add(current.id);
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "banner_impression", id: current.id }),
      keepalive: true,
    }).catch(() => {});
  }, [current]);

  if (!current) return null;

  function trackClick(id: string) {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "banner_click", id }),
      keepalive: true,
    }).catch(() => {});
  }

  const art = bannerArtwork(current);

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
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </picture>
  );

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        SHAPE_SPECS[shape].className
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
