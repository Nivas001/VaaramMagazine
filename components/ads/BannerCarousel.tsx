"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { AdBanner } from "@/lib/types";

/**
 * Rotates through the banners booked for one slot and reports an impression
 * once per banner per page view (and a click when a visitor follows one).
 * Tracking is fire-and-forget so it can never slow the page down.
 */
export function BannerCarousel({ banners }: { banners: AdBanner[] }) {
  const [index, setIndex] = useState(0);
  const counted = useRef<Set<string>>(new Set());
  const current = banners[index];

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000);
    return () => clearInterval(id);
  }, [banners.length]);

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

  function handleClick(id: string) {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "banner_click", id }),
      keepalive: true,
    }).catch(() => {});
  }

  const image = (
    <img
      src={current.image_url}
      alt={`Advertisement by ${current.client_name}`}
      loading="lazy"
      decoding="async"
      className="h-auto w-full object-cover"
    />
  );

  return (
    <div className="bento glass glass-sheen relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {current.target_url ? (
            <a
              href={current.target_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => handleClick(current.id)}
              className="block"
            >
              {image}
            </a>
          ) : (
            image
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Show advertisement ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
