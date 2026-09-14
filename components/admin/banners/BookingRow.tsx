"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { AD_FORMATS, placementSpec, type AdBanner } from "@/lib/types";
import {
  STATE_LABELS,
  bannerState,
  clickRate,
  daysRemaining,
  isEndingSoon,
  runsOutLabel,
} from "@/lib/banner-status";
import { SITE_PAGES, placementGuide } from "@/lib/placement-guide";
import { deleteBanner, toggleBanner } from "@/app/admin/actions";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { RowActions } from "@/components/admin/RowActions";
import { cn, formatDate } from "@/lib/utils";

/** The small coloured word that says what state a booking is in. */
export function StateChip({ banner }: { banner: AdBanner }) {
  const state = bannerState(banner);
  const soon = isEndingSoon(banner);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em]",
          state === "live" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
          state === "scheduled" && "bg-sky-500/14 text-sky-700 dark:text-sky-400",
          state === "expired" && "bg-[rgb(var(--text)/0.08)] text-[rgb(var(--text-muted))]",
          state === "hidden" && "bg-amber-500/14 text-amber-700 dark:text-amber-400"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            state === "live" && "bg-emerald-600 dark:bg-emerald-400",
            state === "scheduled" && "bg-sky-600 dark:bg-sky-400",
            state === "expired" && "bg-[rgb(var(--text-faint))]",
            state === "hidden" && "bg-amber-600 dark:bg-amber-400"
          )}
        />
        {STATE_LABELS[state]}
      </span>

      {soon && (
        <span className="rounded-full bg-amber-500/14 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em] text-amber-700 dark:text-amber-400">
          {runsOutLabel(banner)}
        </span>
      )}
    </span>
  );
}

/**
 * One booking, everywhere a booking is listed.
 *
 * `position`, `isFirst` and `isLast` describe where the banner sits in its own
 * placement's running order — never in the filtered list on screen. Wiring the
 * arrows to a filtered index is the classic way a reorder control starts
 * lying: hide two rows with a search box and "move up" would swap the wrong
 * pair.
 */
export function BookingRow({
  banner,
  position,
  isFirst,
  isLast,
  ordered,
  onPreview,
  showPlacement = true,
}: {
  banner: AdBanner;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  ordered: boolean;
  onPreview: (banner: AdBanner) => void;
  showPlacement?: boolean;
}) {
  const spec = placementSpec(banner.placement);
  const guide = placementGuide(banner.placement);
  const page = SITE_PAGES.find((p) => p.key === guide.page);
  const rate = clickRate(banner);
  const left = daysRemaining(banner);

  return (
    <div className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-4">
      <div className="flex flex-wrap gap-4 sm:flex-nowrap">
        <div className="flex shrink-0 items-start gap-3">
          {ordered && (
            <span className="mt-1 w-5 shrink-0 text-right font-display text-[15px] tabular-nums text-[rgb(var(--text-faint))]">
              {position}
            </span>
          )}
          <button
            type="button"
            onClick={() => onPreview(banner)}
            title="Preview where this appears"
            className="group relative block shrink-0 cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt={`Artwork for ${banner.client_name}`}
              className={cn(
                // Capped so a tall tower does not make its row three times
                // the height of every other row in the list.
                "w-28 max-h-32 rounded border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain transition-colors group-hover:border-[rgb(var(--accent))]/50",
                AD_FORMATS[spec.format].className
              )}
            />
            <span className="absolute inset-0 grid place-items-center rounded bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="size-4 text-white" aria-hidden />
            </span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="truncate font-semibold">{banner.client_name}</h3>
            <StateChip banner={banner} />
          </div>

          {showPlacement && (
            <p className="mt-1.5 text-[13px] text-[rgb(var(--text-muted))]">
              {spec.label}
              <span className="mx-2 text-[rgb(var(--text-faint))]" aria-hidden>
                ·
              </span>
              <span className="text-[rgb(var(--text-faint))]">{page?.label}</span>
            </p>
          )}

          <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">
            {banner.starts_at ? `From ${formatDate(banner.starts_at)}` : "From now"}
            <span className="mx-1.5" aria-hidden>
              →
            </span>
            {banner.expires_at ? formatDate(banner.expires_at) : "no end date"}
            {left !== null && (
              <>
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                {runsOutLabel(banner)}
              </>
            )}
            {banner.edition && (
              <>
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                {banner.edition} edition only
              </>
            )}
          </p>

          <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">
            {banner.impressions.toLocaleString("en-CA")} views
            <span className="mx-2" aria-hidden>
              ·
            </span>
            {banner.clicks.toLocaleString("en-CA")} clicks
            <span className="mx-2" aria-hidden>
              ·
            </span>
            {rate.toFixed(1)}% click rate
            {spec.mode === "carousel" && banner.rotate_seconds ? (
              <>
                <span className="mx-2" aria-hidden>
                  ·
                </span>
                {banner.rotate_seconds}s on screen
              </>
            ) : null}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {ordered && <MoveButtons id={banner.id} isFirst={isFirst} isLast={isLast} />}

            <button
              type="button"
              onClick={() => onPreview(banner)}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-semibold transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
            >
              <Eye className="size-3.5" aria-hidden />
              Preview
            </button>

            <Link
              href={`/admin/banners/${banner.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-semibold transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>

            <RowActions
              id={banner.id}
              isActive={banner.is_active}
              onToggle={toggleBanner}
              onDelete={deleteBanner}
              confirmLabel="Delete for good"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
