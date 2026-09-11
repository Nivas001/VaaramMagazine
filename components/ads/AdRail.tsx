import { getBannersFor } from "@/lib/queries";
import type { BannerPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdCard } from "./AdCard";
import { AdLabel, HouseAd } from "./AdSlot";

/**
 * A standing column of advertisements, as long as the bookings make it.
 *
 * Used where the page already has a column to put it in — beside the reader's
 * pages, for instance. Where the rail has to create its own column instead,
 * use RailLayout, which also handles what happens on a phone.
 *
 * More than one placement may be given, in order. A rail with little of its
 * own booked then tops itself up from a fuller one rather than trailing off
 * beside a long page, and a banner booked into two of them still appears once.
 */
export async function AdRail({
  placements,
  edition,
  limit,
  showTail = true,
  className,
}: {
  placements: BannerPlacement[];
  edition?: string;
  limit?: number;
  showTail?: boolean;
  className?: string;
}) {
  const all = await getBannersFor(placements, edition);
  const banners = limit ? all.slice(0, limit) : all;

  if (banners.length === 0) {
    if (!showTail) return null;
    return <HouseAd format="card" className={className} />;
  }

  return (
    <aside
      aria-label={banners.length > 1 ? "Advertisements" : "Advertisement"}
      data-ad-rail
      className={cn("min-w-0", className)}
    >
      <AdLabel plural={banners.length > 1} />
      <div className="flex flex-col gap-5 sm:gap-6">
        {banners.map((banner) => (
          <AdCard key={banner.id} banner={banner} format="card" />
        ))}
        {showTail && <HouseAd format="card" labelled={false} />}
      </div>
    </aside>
  );
}
