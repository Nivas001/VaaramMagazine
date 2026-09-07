import { getBanners } from "@/lib/queries";
import type { BannerPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "./BannerCarousel";

/**
 * A sponsored placement. Renders nothing at all when the client has not booked
 * that slot, so the layout never shows an empty box.
 */
export async function AdSlot({
  placement,
  edition,
  className,
}: {
  placement: BannerPlacement;
  edition?: string;
  className?: string;
}) {
  const banners = await getBanners(placement, edition);
  if (banners.length === 0) return null;

  return (
    <aside
      aria-label="Advertisement"
      className={cn("relative", className)}
      data-ad-placement={placement}
    >
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--text-muted))]/70">
        Advertisement
      </p>
      <BannerCarousel banners={banners} />
    </aside>
  );
}
