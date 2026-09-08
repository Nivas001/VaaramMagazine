import { getBanners } from "@/lib/queries";
import { BANNER_PLACEMENTS, type BannerPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "./BannerCarousel";

/**
 * A paid placement on the website itself — separate from the advertisements
 * printed inside the weekly PDF.
 *
 * In production a slot with nothing booked renders absolutely nothing, so the
 * layout never shows an empty box. In development it renders a labelled
 * placeholder instead, so the placement can be reviewed while the banners
 * table is still empty.
 */
export async function AdSlot({
  placement,
  edition,
  className,
  shape = "banner",
}: {
  placement: BannerPlacement;
  edition?: string;
  className?: string;
  shape?: "banner" | "inline" | "sidebar";
}) {
  const banners = await getBanners(placement, edition);

  if (banners.length === 0) {
    if (process.env.NODE_ENV === "production") return null;
    return <AdPlaceholder placement={placement} shape={shape} className={className} />;
  }

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn("relative", className)}
    >
      <SlotLabel />
      <BannerCarousel banners={banners} shape={shape} />
    </aside>
  );
}

/** Convenience wrappers, so a page reads as what it is placing. */
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
 * Every advertisement carries a label. It is a requirement of Canadian
 * advertising standards that paid placement is distinguishable from editorial,
 * and it is also simply the honest thing to show a reader.
 */
function SlotLabel() {
  return (
    <p className="label-eyebrow mb-3 text-center text-[10px] text-[rgb(var(--text-faint))]">
      Advertisement
    </p>
  );
}

const ASPECTS = {
  banner: "aspect-[1200/200] min-h-[88px]",
  inline: "aspect-[1200/250] min-h-[110px]",
  sidebar: "aspect-[6/5] min-h-[200px]",
} as const;

/** Development-only. Never reaches a production build. */
function AdPlaceholder({
  placement,
  shape,
  className,
}: {
  placement: BannerPlacement;
  shape: keyof typeof ASPECTS;
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
          ASPECTS[shape]
        )}
      >
        <p className="label-eyebrow text-[rgb(var(--text-faint))]">
          {spec?.label ?? placement}
        </p>
        <p className="text-xs text-[rgb(var(--text-faint))]">{spec?.hint}</p>
      </div>
    </aside>
  );
}
