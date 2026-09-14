"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  formatSize,
  placementSpec,
  type AdBanner,
  type BannerPlacement,
} from "@/lib/types";
import { slotFill, type SlotFill } from "@/lib/banner-status";
import { SITE_PAGES, capacityLabel, placementGuide } from "@/lib/placement-guide";
import { PageWireframe, WireframeLegend } from "./Wireframe";
import { cn } from "@/lib/utils";

/**
 * "Show me where this lands on the actual website."
 *
 * The same component answers it in three places — the inventory board, the
 * booking form and the edit screen — so that the picture an administrator
 * checks before saving is the identical picture they were shown while
 * choosing the slot. Two different drawings of the same slot would be worse
 * than one drawing and no second opinion.
 *
 * `pending` is artwork chosen in a form and not yet uploaded anywhere. It is
 * dropped into the slot's first frame so the preview shows the booking being
 * made, not just the ones already live.
 */
export function SlotPreview({
  placement,
  banners,
  pending,
  className,
  compact = false,
}: {
  placement: BannerPlacement;
  banners: AdBanner[];
  pending?: { imageUrl: string; clientName: string } | null;
  className?: string;
  /** Drops the legend and the fact list — for a tight column inside a form. */
  compact?: boolean;
}) {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const spec = placementSpec(placement);
  const guide = placementGuide(placement);
  const page = SITE_PAGES.find((p) => p.key === guide.page);

  const fills = useMemo(() => {
    const map = fillMap(banners);
    if (pending) {
      const existing = map[placement];
      const ghost = {
        id: "__pending__",
        client_name: pending.clientName || "This booking",
        image_url: pending.imageUrl,
      } as AdBanner;
      map[placement] = {
        ...(existing ?? slotFill(placement, [])),
        // First frame, so the eye lands on the one being booked.
        live: [ghost, ...(existing?.live ?? [])],
      };
    }
    return map;
  }, [banners, pending, placement]);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold">
          {page?.label}
          <span className="mx-2 text-[rgb(var(--text-faint))]" aria-hidden>
            ·
          </span>
          <span className="font-normal text-[rgb(var(--text-muted))]">{spec.label}</span>
        </p>

        <div className="flex items-center gap-1 rounded-full border border-[rgb(var(--hairline))] p-0.5">
          {(
            [
              { key: "desktop", Icon: Monitor, label: "Desktop" },
              { key: "phone", Icon: Smartphone, label: "Phone" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-pressed={device === key}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors",
                device === key
                  ? "bg-[rgb(var(--accent))] text-white"
                  : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWireframe
        page={guide.page}
        fills={fills}
        focus={placement}
        showArtwork
        device={device}
      />

      {!compact && (
        <>
          <WireframeLegend className="mt-3" />

          <dl className="mt-4 space-y-2.5 text-[13px] leading-relaxed">
            <Fact term="Where a reader meets it">{guide.where}</Fact>
            <Fact term="On a phone">{guide.onPhone}</Fact>
            {guide.alsoAppears && <Fact term="Also appears">{guide.alsoAppears}</Fact>}
            <Fact term="How many fit">{capacityLabel(placement)}</Fact>
            <Fact term="Artwork needed">
              {formatSize(spec.format)} — {AD_FORMATS[spec.format].label}.{" "}
              {AD_FORMATS[spec.format].hint}
            </Fact>
          </dl>

          {page && (
            <a
              href={page.href}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--accent-text))] underline decoration-[rgb(var(--accent))]/40 underline-offset-4 hover:decoration-[rgb(var(--accent))]"
            >
              Open the real page
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </>
      )}
    </div>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-faint))] sm:pt-0.5">
        {term}
      </dt>
      <dd className="text-[rgb(var(--text-muted))]">{children}</dd>
    </div>
  );
}

/** Every placement's occupancy, worked out once for a whole screen. */
export function fillMap(
  banners: AdBanner[],
  now?: Date
): Partial<Record<BannerPlacement, SlotFill>> {
  const map: Partial<Record<BannerPlacement, SlotFill>> = {};
  for (const spec of BANNER_PLACEMENTS) {
    map[spec.value] = slotFill(spec.value, banners, now);
  }
  return map;
}
