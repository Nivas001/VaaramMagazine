"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SHAPE_ASPECTS, type AdBanner, type BannerShape } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Rotates through the banners booked for one slot, recording an impression once
 * per banner per page view and a click when a visitor follows one. Tracking is
 * fire-and-forget: a failed counter must never slow a page or surface an error.
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

  const image = (
    // Banner artwork is uploaded by advertisers and served from object storage.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current.image_url}
      alt={`Advertisement by ${current.client_name}`}
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
    />
  );

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "relative overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        SHAPE_ASPECTS[shape]
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
          {current.target_url ? (
            <a
              href={current.target_url}
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
