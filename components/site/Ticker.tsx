import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

/**
 * The publication ticker.
 *
 * This announces the edition and the advertising offer — it is deliberately not
 * a news crawl, because Vaaram does not publish news. It runs slowly, uses no
 * JavaScript, pauses when hovered, and stops entirely for visitors who ask for
 * reduced motion (handled globally in globals.css).
 *
 * The strip is duplicated once and translated by exactly -50%, which is what
 * makes the loop seamless rather than snapping back at the end.
 */
export function Ticker({ className }: { className?: string }) {
  const items = siteConfig.ticker;

  return (
    <div
      className={cn(
        "group relative overflow-hidden border-b border-white/10 bg-warm-950 text-warm-50",
        className
      )}
    >
      {/* Feathered edges so words fade out rather than clipping at the bezel. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-warm-950 to-transparent sm:w-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-warm-950 to-transparent sm:w-20"
        aria-hidden
      />

      <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {/* Rendered twice: the first copy is read out, the second is purely
            visual filler that makes the wrap-around invisible. */}
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? true : undefined}
            aria-label={copy === 0 ? "Publication announcements" : undefined}
          >
            {items.map((item) => (
              <li
                key={item}
                className="flex shrink-0 items-center gap-6 px-6 py-2.5 sm:gap-8 sm:px-8"
              >
                <span className="label-eyebrow whitespace-nowrap text-warm-100/85">
                  {item}
                </span>
                <span
                  className="size-[3px] shrink-0 rotate-45 bg-gold-soft/70"
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
