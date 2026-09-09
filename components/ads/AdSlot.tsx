import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBanners } from "@/lib/queries";
import {
  BANNER_PLACEMENTS,
  SHAPE_ASPECTS,
  type BannerPlacement,
  type BannerShape,
} from "@/lib/types";
import { siteConfig } from "@/site.config";
import { VaaramMark } from "@/components/site/VaaramMark";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "./BannerCarousel";

/**
 * A paid placement on the website itself — separate from the advertisements
 * printed inside the weekly PDF.
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
  shape,
  fallback = "house",
  label = true,
}: {
  placement: BannerPlacement;
  edition?: string;
  className?: string;
  /** Defaults to the shape declared for this placement in lib/types.ts. */
  shape?: BannerShape;
  fallback?: "house" | "none";
  label?: boolean;
}) {
  const spec = BANNER_PLACEMENTS.find((p) => p.value === placement);
  const resolved: BannerShape = shape ?? spec?.shape ?? "banner";
  const banners = await getBanners(placement, edition);

  if (banners.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      return <AdPlaceholder placement={placement} shape={resolved} className={className} />;
    }
    if (fallback === "none") return null;
    return <HouseAd shape={resolved} className={className} />;
  }

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn("relative", className)}
    >
      {label && <SlotLabel />}
      <BannerCarousel banners={banners} shape={resolved} />
    </aside>
  );
}

/** Convenience wrappers, so a page reads as what it is placing. */
export function LeaderboardAd(props: Omit<Parameters<typeof AdSlot>[0], "shape">) {
  return <AdSlot {...props} shape="leaderboard" />;
}

export function BannerAd(props: Omit<Parameters<typeof AdSlot>[0], "shape">) {
  return <AdSlot {...props} shape="banner" />;
}

export function InlineAd(props: Omit<Parameters<typeof AdSlot>[0], "shape">) {
  return <AdSlot {...props} shape="inline" />;
}

export function SidebarAd(props: Omit<Parameters<typeof AdSlot>[0], "shape">) {
  return <AdSlot {...props} shape="sidebar" />;
}

/**
 * Every advertisement carries a label. Canadian advertising standards require
 * paid placement to be distinguishable from editorial, and it is also simply
 * the honest thing to show a reader.
 */
function SlotLabel() {
  return (
    <p className="label-eyebrow mb-3 text-center text-[10px] text-[rgb(var(--text-faint))]">
      Advertisement
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
const HOUSE_HEIGHTS: Record<BannerShape, string> = {
  leaderboard: "min-h-[132px] sm:min-h-[112px]",
  banner: "min-h-[140px] sm:min-h-[120px]",
  inline: "min-h-[150px] sm:min-h-[132px]",
  sidebar: "min-h-[260px]",
  square: "min-h-[280px]",
};

function HouseAd({ shape, className }: { shape: BannerShape; className?: string }) {
  const upright = shape === "sidebar" || shape === "square";

  return (
    <aside
      aria-label="Advertise with Vaaram Magazine"
      data-ad-house
      className={cn("relative", className)}
    >
      <p className="label-eyebrow mb-3 text-center text-[10px] text-[rgb(var(--text-faint))]">
        Vaaram advertising
      </p>

      <Link
        href="/contact"
        className={cn(
          "group flex w-full items-center justify-center gap-x-6 gap-y-3 rounded-lg px-6 text-center",
          "border border-dashed border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/55",
          "transition-colors hover:border-[rgb(var(--accent))]/45 hover:bg-[rgb(var(--surface-2))]",
          upright ? "flex-col py-8" : "flex-col py-6 sm:flex-row sm:text-left",
          // A house panel sizes to its own words rather than to the artwork
          // proportion — an 8:1 leaderboard would crush this copy.
          HOUSE_HEIGHTS[shape]
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
  shape,
  className,
}: {
  placement: BannerPlacement;
  shape: BannerShape;
  className?: string;
}) {
  const spec = BANNER_PLACEMENTS.find((p) => p.value === placement);

  return (
    <aside
      aria-hidden
      data-ad-placement={placement}
      data-ad-placeholder
      className={cn("relative", className)}
    >
      <SlotLabel />
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-6 text-center",
          "border border-dashed border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60",
          SHAPE_ASPECTS[shape]
        )}
      >
        <p className="label-eyebrow text-[rgb(var(--text-faint))]">
          {spec?.label ?? placement}
        </p>
        <p className="text-xs text-[rgb(var(--text-faint))]">{spec?.hint}</p>
        <p className="mt-1 text-[11px] text-[rgb(var(--text-faint))]/80">
          Upload artwork in {siteConfig.name} admin → Banners
        </p>
      </div>
    </aside>
  );
}
