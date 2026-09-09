"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef, type PointerEvent } from "react";
import type { Publication } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The weekly edition rendered as a physical magazine rather than a card.
 *
 * Three things sell the object: a block of pages peeking out on the right, a
 * printed spine shadow down the binding edge, and a slow tilt that follows the
 * pointer. The tilt is clamped tightly — the aim is a sense of depth, not a
 * toy — and it is switched off entirely for reduced-motion visitors and on
 * touch, where there is no hover to drive it.
 */
export function MagazineCover({
  publication,
  size = "lg",
  interactive = true,
  priority = false,
  className,
}: {
  publication: Publication;
  size?: "sm" | "md" | "lg" | "fluid";
  interactive?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const live = interactive && !reduce;

  // Pointer position, normalised to -0.5…0.5 across the element.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 150, damping: 20, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-11, 11]), spring);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), spring);
  // The sheen slides opposite to the tilt, the way light does on real stock.
  const sheenX = useSpring(useTransform(px, [-0.5, 0.5], [72, 28]), spring);
  const sheen = useTransform(
    sheenX,
    (x) =>
      `linear-gradient(104deg, rgba(255,255,255,0) ${x - 14}%, rgba(255,255,255,0.4) ${x}%, rgba(255,255,255,0) ${x + 14}%)`
  );

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!live || event.pointerType === "touch") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onPointerLeave() {
    px.set(0);
    py.set(0);
  }

  const widths = {
    sm: "w-[150px] sm:w-[180px]",
    md: "w-[220px] sm:w-[280px]",
    lg: "w-[min(78vw,340px)] sm:w-[min(42vw,420px)] lg:w-[440px]",
    // Fills whatever the parent gives it — used where the caller owns the grid.
    fluid: "w-full",
  }[size];

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative shrink-0", widths, className)}
      style={{ perspective: 1400 }}
    >
      <motion.div
        style={live ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="relative aspect-[3/4] w-full"
      >
        {/* The block of pages, offset so it reads as thickness. */}
        <div
          className="page-stack absolute inset-y-[1.5%] left-[1.5%] right-[-2.2%] shadow-[0_20px_50px_-24px_rgba(20,16,12,0.5)]"
          aria-hidden
        />
        <div
          className="page-stack absolute inset-y-[0.8%] left-[0.8%] right-[-1.1%] opacity-90"
          aria-hidden
        />

        {/* The cover itself. */}
        <div className="page-stock absolute inset-0">
          <CoverArt publication={publication} priority={priority} />

          {live && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[4] mix-blend-soft-light"
              style={{ background: sheen }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * The cover image, or a typeset stand-in when an edition has been published
 * without artwork. The stand-in is designed rather than empty, so an issue
 * missing its cover still looks deliberate in the archive.
 */
export function CoverArt({
  publication,
  priority = false,
  className,
}: {
  publication: Publication;
  priority?: boolean;
  className?: string;
}) {
  if (publication.cover_url) {
    return (
      // Covers are served straight from object storage, so Next's optimiser is
      // bypassed site-wide (see next.config.ts) and a plain <img> is correct.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={publication.cover_url}
        alt={`Cover of ${publication.title}, ${formatDate(publication.edition_date)}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <div
      // Type is sized in container-query units so the stand-in scales with the
      // cover at every size the component is used at.
      style={{ containerType: "inline-size" }}
      className={cn(
        "flex size-full flex-col justify-between bg-warm-950 p-[7%] text-warm-50",
        className
      )}
    >
      <div>
        <p className="font-display text-[clamp(1.5rem,9cqw,3rem)] font-medium leading-none tracking-[-0.04em]">
          Vaaram
        </p>
        <div className="mt-[4%] h-px w-full bg-wine" aria-hidden />
        <p className="label-eyebrow mt-[4%] text-[clamp(0.5rem,2.4cqw,0.7rem)] text-wine-soft">
          Weekly advertising magazine
        </p>
      </div>

      <div>
        <p className="font-display text-[clamp(1.1rem,6cqw,2rem)] leading-tight tracking-[-0.02em]">
          {publication.title}
        </p>
        <p className="mt-[3%] text-[clamp(0.6rem,2.8cqw,0.85rem)] text-warm-300">
          {formatDate(publication.edition_date)}
        </p>
      </div>
    </div>
  );
}
