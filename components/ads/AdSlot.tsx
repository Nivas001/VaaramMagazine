import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBanners } from "@/lib/queries";
import {
  AD_FORMATS,
  placementSpec,
  type AdBanner,
  type AdFormat,
  type BannerPlacement,
} from "@/lib/types";
import { siteConfig } from "@/site.config";
import { VaaramMark } from "@/components/site/VaaramMark";
import { cn } from "@/lib/utils";
import { AdCard } from "./AdCard";
import { BannerCarousel } from "./BannerCarousel";

/**
 * A paid placement on the website itself — separate from the advertisements
 * printed inside the weekly PDF.
 *
 * What a slot renders is decided by its placement, in lib/types.ts:
 *   · "carousel" — one banner at a time, rotating. A single wide strip.
 *   · "stack"    — every banner booked, one under another. This is what lets a
 *                  side rail hold any number of advertisements.
 *   · "grid"     — every banner booked, wrapping across columns.
 *
 * A slot with nothing booked never renders an empty box. What it renders
 * instead depends on `fallback`:
 *   · "house"  — Vaaram's own "this space is available" panel. It is honest
 *                (it is our advertisement, and it says so), it keeps the page
 *                rhythm intact before the first client is signed, and it sells
 *                the slot to the businesses reading the site.
 *   · "none"   — nothing at all, for slots that should silently collapse.
 * In development an unbooked slot always shows a labelled outline instead, so
 * placements can be reviewed while the banners table is still empty.
 */
export async function AdSlot({
  placement,
  edition,
  className,
  fallback = "house",
  label = true,
}: {
  placement: BannerPlacement;
  edition?: string;
  className?: string;
  fallback?: "house" | "none";
  label?: boolean;
}) {
  const spec = placementSpec(placement);
  const banners = await getBanners(placement, edition);

  if (banners.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return <AdPlaceholder placement={placement} className={className} />;
    }
    if (fallback === "none") return null;
    return <HouseAd format={spec.format} className={className} />;
  }

  return (
    <aside
      aria-label={banners.length > 1 ? "Advertisements" : "Advertisement"}
      data-ad-placement={placement}
      className={cn("relative", className)}
    >
      {label && <AdLabel plural={spec.mode !== "carousel" && banners.length > 1} />}

      {spec.mode === "carousel" && (
        <BannerCarousel banners={banners} format={spec.format} />
      )}

      {spec.mode === "stack" && (
        <div className="flex flex-col gap-5 sm:gap-6">
          {banners.map((banner) => (
            <AdCard key={banner.id} banner={banner} format={spec.format} />
          ))}
        </div>
      )}

      {spec.mode === "grid" && <AdGrid banners={banners} format={spec.format} />}
    </aside>
  );
}

/**
 * Advertisements wrapping across columns — the footer's shape.
 *
 * It holds any number: two across on a phone, four on a wide screen, as many
 * rows as have been booked.
 */
export function AdGrid({
  banners,
  format = "card",
  className,
}: {
  banners: AdBanner[];
  format?: AdFormat;
  className?: string;
}) {
  return (
    <div
      data-ad-grid
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
        className
      )}
    >
      {banners.map((banner) => (
        <AdCard key={banner.id} banner={banner} format={format} />
      ))}
    </div>
  );
}

/**
 * Every advertisement carries a label. Canadian advertising standards require
 * paid placement to be distinguishable from editorial, and it is also simply
 * the honest thing to show a reader. One label covers a whole rail — twenty
 * repetitions of the word would be noise, not disclosure.
 */
export function AdLabel({ plural = false }: { plural?: boolean }) {
  return (
    <p className="label-eyebrow mb-3 text-center text-[10px] text-[rgb(var(--text-faint))]">
      {plural ? "Advertisements" : "Advertisement"}
    </p>
  );
}

/**
 * Vaaram advertising its own empty slot.
 *
 * Deliberately quiet: a dashed rule, the mark, one line and one link. It must
 * never be mistaken for a client's booking, which is why it is labelled as
 * Vaaram's own and styled unlike every paid banner.
 */
const HOUSE_HEIGHTS: Record<AdFormat, string> = {
  card: "min-h-[190px]",
  strip: "min-h-[140px] sm:min-h-[120px]",
};

export function HouseAd({
  format = "strip",
  className,
  labelled = true,
}: {
  format?: AdFormat;
  className?: string;
  /** A rail already carries one label; its tail does not need another. */
  labelled?: boolean;
}) {
  const upright = format === "card";

  return (
    <aside
      aria-label="Advertise with Vaaram Magazine"
      data-ad-house
      className={cn("relative", className)}
    >
      {labelled && (
        <p className="label-eyebrow mb-3 text-center text-[10px] text-[rgb(var(--text-faint))]">
          Vaaram advertising
        </p>
      )}

      <Link
        href="/contact"
        className={cn(
          "group flex w-full items-center justify-center gap-x-6 gap-y-3 rounded-lg px-6 text-center",
          "border border-dashed border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/55",
          "transition-colors hover:border-[rgb(var(--accent))]/45 hover:bg-[rgb(var(--surface-2))]",
          upright ? "flex-col py-8" : "flex-col py-6 sm:flex-row sm:text-left",
          // A house panel sizes to its own words rather than to the artwork
          // proportion — a 5.5:1 strip would crush this copy.
          HOUSE_HEIGHTS[format]
        )}
      >
        <VaaramMark className="size-8 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
        <span className={cn(upright && "text-center")}>
          <span className="block font-display text-[19px] leading-tight tracking-[-0.02em]">
            This space could be your advertisement
          </span>
          <span className="mt-1.5 block text-[13.5px] text-[rgb(var(--text-muted))]">
            Seen by everyone reading this week&apos;s edition.
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--accent-text))]">
          Book this slot
          <ArrowRight
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Link>
    </aside>
  );
}

/** Development-only. Never reaches a production build. */
function AdPlaceholder({
  placement,
  className,
}: {
  placement: BannerPlacement;
  className?: string;
}) {
  const spec = placementSpec(placement);

  return (
    <aside
      aria-hidden
      data-ad-placement={placement}
      data-ad-placeholder
      className={cn("relative", className)}
    >
      <AdLabel />
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-6 text-center",
          "border border-dashed border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60",
          AD_FORMATS[spec.format].className
        )}
      >
        <p className="label-eyebrow text-[rgb(var(--text-faint))]">{spec.label}</p>
        <p className="text-xs text-[rgb(var(--text-faint))]">{spec.hint}</p>
        <p className="mt-1 text-[11px] text-[rgb(var(--text-faint))]/80">
          Upload artwork in {siteConfig.name} admin → Banners
        </p>
      </div>
    </aside>
  );
}
