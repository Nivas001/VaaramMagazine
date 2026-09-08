"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SceneFallback } from "./SceneFallback";

const AdvertisementScene = dynamic(() => import("./AdvertisementScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * The About page's central story: loose advertisements become one weekly
 * edition. A tall scroll track drives a sticky stage; the 3D scene reads the
 * progress from a ref, so scrolling never triggers a React re-render.
 *
 * The scene is only ever loaded when it is worth loading — a wide viewport, a
 * working WebGL context, more than two cores, and no reduced-motion request.
 * Everything else gets the drawn fallback, which tells the same story.
 */

const STAGES = [
  {
    title: "Advertisements arrive",
    body: "A shop, a landlord, a tradesperson, an employer. Each one has something to say and someone specific who needs to hear it.",
  },
  {
    title: "We gather and sort them",
    body: "Every advertisement is laid out, checked and grouped with the section a reader would look for it in.",
  },
  {
    title: "They become pages",
    body: "Sorted advertisements are set into the pages of the week's edition — the shape a reader actually holds.",
  },
  {
    title: "The edition is published",
    body: "The pages become one magazine, online the same week and free for anyone to open.",
  },
];

/** A conservative test for whether this device should run the scene at all. */
function shouldRender3D(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // Below this width the cards would be too small to read, and the phones in
  // this range are the ones least able to spare the frames.
  if (window.matchMedia("(max-width: 900px)").matches) return false;
  if ((navigator.hardwareConcurrency ?? 4) < 4) return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // Release the probe context immediately; browsers cap how many exist.
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function DiscoveryToConnection() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);
  const [use3D, setUse3D] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => setUse3D(shouldRender3D()), []);

  /** Unmount the canvas entirely when the section is off screen. */
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const distance = rect.height - window.innerHeight;
    if (distance <= 0) return;

    const p = Math.min(Math.max(-rect.top / distance, 0), 1);
    progress.current = p;

    // React only hears about whole-stage changes, never individual frames.
    const next = Math.min(Math.floor(p * STAGES.length), STAGES.length - 1);
    setStage((current) => (current === next ? current : next));
  }, []);

  useEffect(() => {
    let frame = 0;
    const handler = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(onScroll);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [onScroll]);

  const active = STAGES[stage];

  return (
    <section
      ref={track}
      aria-labelledby="journey-heading"
      className="relative bg-warm-950 text-warm-50"
      // Four stages need room to breathe; on a phone the fallback makes this
      // shorter because there is nothing to choreograph.
      style={{ height: use3D ? "360vh" : undefined }}
    >
      {use3D ? (
        /* The scene fills the whole sticky stage and the words sit over it,
           so the cards get the full frame rather than a strip between two
           blocks of text. Scrims keep the copy readable over any card. */
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
          {inView && <AdvertisementScene progress={progress} />}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-warm-950 via-warm-950/70 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-warm-950 via-warm-950/80 to-transparent"
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
            <p className="label-eyebrow text-brass-soft">From discovery to connection</p>
            <h2 id="journey-heading" className="display-lg mt-5 max-w-lg text-warm-50">
              How an advertisement becomes the week&apos;s edition.
            </h2>
          </div>

          <div className="relative mt-auto mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
            <ol className="mb-7 flex gap-2" aria-hidden>
              {STAGES.map((s, i) => (
                <li
                  key={s.title}
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    i <= stage ? "bg-ember-soft" : "bg-white/15"
                  )}
                />
              ))}
            </ol>

            {/* Announced politely, so a screen reader follows the story too. */}
            <div className="max-w-lg" aria-live="polite">
              <p className="label-eyebrow text-warm-500">
                Step {stage + 1} of {STAGES.length}
              </p>
              <h3 className="mt-3 font-display text-3xl tracking-[-0.025em] text-warm-50 sm:text-4xl">
                {active.title}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-warm-300 sm:text-base">
                {active.body}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <p className="label-eyebrow text-brass-soft">From discovery to connection</p>
            <h2 id="journey-heading" className="display-lg mt-5 max-w-lg text-warm-50">
              How an advertisement becomes the week&apos;s edition.
            </h2>
          </div>
          <SceneFallback />
        </div>
      )}
    </section>
  );
}

export { STAGES };
