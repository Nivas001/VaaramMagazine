"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  LayoutGrid,
  ListFilter,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  placementSpec,
  type AdBanner,
  type BannerPlacement,
} from "@/lib/types";
import {
  ENDING_SOON_DAYS,
  bannerState,
  daysRemaining,
  isEndingSoon,
  runsOutLabel,
  type BannerState,
} from "@/lib/banner-status";
import {
  SITE_PAGES,
  VALUE_LABELS,
  capacityLabel,
  placementGuide,
  placementsOnPage,
} from "@/lib/placement-guide";
import { PageWireframe, WireframeLegend } from "./Wireframe";
import { SlotPreview, fillMap } from "./SlotPreview";
import { BookingRow, StateChip } from "./BookingRow";
import { Modal } from "./Modal";
import { cn, formatDate } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ADVERTISEMENT DESK
 *
 *  The screen this replaced was a single long list of whatever happened to be
 *  booked, grouped by a placement name only a developer could read. It could
 *  not answer any of the three questions the job actually consists of:
 *
 *    1. What have we sold, and what is still free?
 *    2. Where does this advertisement land on the website?
 *    3. What runs out soon, and needs renewing or replacing?
 *
 *  So the desk has three views, one per question — a map of the site's
 *  inventory, a searchable list of every booking, and a schedule. They share
 *  one set of data and one vocabulary (see lib/banner-status.ts), so the
 *  counts can never disagree between them.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type View = "map" | "list" | "schedule";
type Filter = "all" | BannerState | "ending";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "live", label: "Live" },
  { key: "ending", label: "Ending soon" },
  { key: "scheduled", label: "Scheduled" },
  { key: "hidden", label: "Paused" },
  { key: "expired", label: "Finished" },
];

const BOOKABLE = BANNER_PLACEMENTS.filter((p) => !p.legacy);

export function BannersWorkspace({ banners }: { banners: AdBanner[] }) {
  const [view, setView] = useState<View>("map");
  const [openSlot, setOpenSlot] = useState<BannerPlacement | null>(null);
  const [preview, setPreview] = useState<AdBanner | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const fills = useMemo(() => fillMap(banners), [banners]);

  /**
   * Each banner's true place in its own placement's running order, so the
   * reorder arrows stay correct however the list on screen is filtered.
   */
  const order = useMemo(() => {
    const map = new Map<string, { position: number; isFirst: boolean; isLast: boolean }>();
    for (const spec of BANNER_PLACEMENTS) {
      const rows = banners.filter((b) => b.placement === spec.value);
      rows.forEach((b, i) =>
        map.set(b.id, { position: i + 1, isFirst: i === 0, isLast: i === rows.length - 1 })
      );
    }
    return map;
  }, [banners]);

  const live = banners.filter((b) => bannerState(b) === "live");
  const scheduled = banners.filter((b) => bannerState(b) === "scheduled");
  const hidden = banners.filter((b) => bannerState(b) === "hidden");
  const finished = banners.filter((b) => bannerState(b) === "expired");
  const ending = live
    .filter((b) => isEndingSoon(b))
    .sort((a, b) => (daysRemaining(a) ?? 0) - (daysRemaining(b) ?? 0));

  const emptySlots = BOOKABLE.filter((p) => fills[p.value]?.state === "empty");
  const freeFrames = BOOKABLE.reduce((sum, p) => sum + (fills[p.value]?.freeFrames ?? 0), 0);
  const views = banners.reduce((sum, b) => sum + (b.impressions ?? 0), 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return banners.filter((b) => {
      if (needle) {
        const spec = placementSpec(b.placement);
        const haystack = `${b.client_name} ${spec.label} ${b.target_url ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (filter === "all") return true;
      if (filter === "ending") return isEndingSoon(b);
      return bannerState(b) === filter;
    });
  }, [banners, query, filter]);

  function rowProps(banner: AdBanner) {
    const o = order.get(banner.id) ?? { position: 1, isFirst: true, isLast: true };
    const rows = fills[banner.placement]?.all.length ?? 1;
    return {
      position: o.position,
      isFirst: o.isFirst,
      isLast: o.isLast,
      // Order only matters where more than one banner shares the slot.
      ordered: rows > 1,
      onPreview: setPreview,
    };
  }

  return (
    <>
      {/* ── What is happening right now ──────────────────────────────────── */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Figure label="Live on the site" value={live.length} tone="good" hint="Readers can see these" />
        <Figure
          label={`Ending within ${ENDING_SOON_DAYS} days`}
          value={ending.length}
          tone={ending.length > 0 ? "warn" : "plain"}
          hint={ending.length > 0 ? "Renew or replace" : "Nothing to chase"}
        />
        <Figure label="Scheduled" value={scheduled.length} hint="Waiting for a start date" />
        <Figure label="Paused" value={hidden.length} hint="Switched off by hand" />
        <Figure
          label="Free frames to sell"
          value={freeFrames === 0 && emptySlots.length === 0 ? "0" : `${freeFrames}+`}
          tone="sell"
          hint={`${emptySlots.length} slot${emptySlots.length === 1 ? "" : "s"} completely empty`}
        />
      </div>

      {/* ── The one thing that needs doing today ─────────────────────────── */}
      {ending.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/35 bg-amber-500/8 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
            {ending.length} booking{ending.length === 1 ? "" : "s"} finish
            {ending.length === 1 ? "es" : ""} within {ENDING_SOON_DAYS} days
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ending.slice(0, 6).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/banners/${b.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-[rgb(var(--surface-3))] px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:border-amber-500/70"
                >
                  {b.client_name}
                  <span className="text-[rgb(var(--text-faint))]">{runsOutLabel(b)}</span>
                </Link>
              </li>
            ))}
            {ending.length > 6 && (
              <li className="self-center text-[12.5px] text-[rgb(var(--text-muted))]">
                and {ending.length - 6} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ── View switch ──────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[rgb(var(--hairline))]">
        <Tab active={view === "map"} onClick={() => setView("map")} Icon={LayoutGrid}>
          Where ads appear
        </Tab>
        <Tab active={view === "list"} onClick={() => setView("list")} Icon={ListFilter}>
          All bookings
          <Count>{banners.length}</Count>
        </Tab>
        <Tab active={view === "schedule"} onClick={() => setView("schedule")} Icon={CalendarClock}>
          Schedule
        </Tab>
      </div>

      {view === "map" && (
        <MapView
          fills={fills}
          onOpenSlot={setOpenSlot}
          emptyCount={emptySlots.length}
          totalViews={views}
        />
      )}

      {view === "list" && (
        <ListView
          banners={visible}
          total={banners.length}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          rowProps={rowProps}
          counts={{
            all: banners.length,
            live: live.length,
            ending: ending.length,
            scheduled: scheduled.length,
            hidden: hidden.length,
            expired: finished.length,
          }}
        />
      )}

      {view === "schedule" && <ScheduleView banners={banners} onPreview={setPreview} />}

      {/* ── Slot detail ──────────────────────────────────────────────────── */}
      <Modal
        open={openSlot !== null}
        onClose={() => setOpenSlot(null)}
        wide
        title={openSlot ? placementSpec(openSlot).label : ""}
        lead={openSlot ? fills[openSlot]?.summary : undefined}
      >
        {openSlot && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <SlotPreview placement={openSlot} banners={banners} />

            <div className="min-w-0">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]">
                Booked into this slot
              </h3>

              {(fills[openSlot]?.all.length ?? 0) === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-[rgb(var(--hairline))] px-4 py-6 text-center text-[13.5px] text-[rgb(var(--text-muted))]">
                  Nothing booked here yet. The website shows its own “this space
                  could be your advertisement” panel until something is.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {fills[openSlot]?.all.map((b, i) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-3 rounded-lg border border-[rgb(var(--hairline))] p-2.5"
                    >
                      <span className="w-4 shrink-0 text-right font-display text-[13px] tabular-nums text-[rgb(var(--text-faint))]">
                        {i + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.image_url}
                        alt=""
                        className="h-9 w-16 shrink-0 rounded border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold">
                          {b.client_name}
                        </span>
                        <span className="mt-1 block">
                          <StateChip banner={b} />
                        </span>
                      </span>
                      <Link
                        href={`/admin/banners/${b.id}/edit`}
                        className="shrink-0 text-[12.5px] font-semibold text-[rgb(var(--accent-text))] underline decoration-[rgb(var(--accent))]/40 underline-offset-4"
                      >
                        Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/admin/banners/new?placement=${openSlot}`}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
              >
                <Plus className="size-4" aria-hidden />
                Book this slot
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* ── One booking, in position ─────────────────────────────────────── */}
      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        wide
        title={preview ? `${preview.client_name} — in position` : ""}
        lead={
          preview
            ? `${placementSpec(preview.placement).label} · ${AD_FORMATS[placementSpec(preview.placement).format].label}`
            : undefined
        }
        footer={
          preview && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-[rgb(var(--text-muted))]">
                {preview.impressions.toLocaleString("en-CA")} views ·{" "}
                {preview.clicks.toLocaleString("en-CA")} clicks · {runsOutLabel(preview)}
              </p>
              <Link
                href={`/admin/banners/${preview.id}/edit`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-4 text-[13px] font-semibold text-white hover:bg-wine-strong"
              >
                Edit this booking
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          )
        }
      >
        {preview && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
            <SlotPreview
              placement={preview.placement}
              banners={[preview, ...banners.filter((b) => b.id !== preview.id)]}
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]">
                The artwork itself
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.image_url}
                alt={`Artwork for ${preview.client_name}`}
                className={cn(
                  "mt-2 w-full rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain",
                  AD_FORMATS[placementSpec(preview.placement).format].className
                )}
              />
              <p className="mt-3 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">
                {preview.target_url ? (
                  <>
                    Clicking it opens{" "}
                    <span className="break-all font-medium text-[rgb(var(--text))]">
                      {preview.target_url}
                    </span>
                  </>
                ) : (
                  "No link — this one is not clickable."
                )}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ── View 1: the map ──────────────────────────────────────────────────────── */

function MapView({
  fills,
  onOpenSlot,
  emptyCount,
  totalViews,
}: {
  fills: ReturnType<typeof fillMap>;
  onOpenSlot: (placement: BannerPlacement) => void;
  emptyCount: number;
  totalViews: number;
}) {
  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl text-[14.5px] leading-relaxed text-[rgb(var(--text-muted))]">
          Every advertisement space the website sells, drawn where it actually
          sits. Click any block to see what is in it, preview it, or book it.
          {emptyCount > 0 && (
            <>
              {" "}
              <span className="font-semibold text-[rgb(var(--text))]">
                {emptyCount} {emptyCount === 1 ? "slot is" : "slots are"} completely
                empty
              </span>{" "}
              and showing Vaaram&apos;s own “book this space” panel instead.
            </>
          )}
        </p>
        <p className="text-[13px] text-[rgb(var(--text-faint))]">
          {totalViews.toLocaleString("en-CA")} advertisement views counted all-time
        </p>
      </div>

      <WireframeLegend className="mt-4" />

      <div className="mt-7 space-y-10">
        {SITE_PAGES.map((page) => {
          const slots = placementsOnPage(page.key);
          if (slots.length === 0) return null;

          return (
            <section key={page.key}>
              <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[rgb(var(--hairline))] pb-3">
                <h2 className="font-display text-xl tracking-[-0.02em]">{page.label}</h2>
                <p className="text-[13px] text-[rgb(var(--text-muted))]">{page.lead}</p>
              </header>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
                <PageWireframe
                  page={page.key}
                  fills={fills}
                  onSelect={onOpenSlot}
                  className="lg:sticky lg:top-40"
                />

                <ul className="space-y-2.5">
                  {slots.map((spec) => {
                    const fill = fills[spec.value];
                    const guide = placementGuide(spec.value);
                    const empty = fill?.state === "empty";

                    return (
                      <li key={spec.value}>
                        <button
                          type="button"
                          onClick={() => onOpenSlot(spec.value)}
                          className={cn(
                            "w-full cursor-pointer rounded-lg border p-4 text-left transition-colors",
                            empty
                              ? "border-dashed border-[rgb(var(--text-faint))]/50 bg-[rgb(var(--surface-2))]/40 hover:border-[rgb(var(--accent))]/50"
                              : "border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] hover:border-[rgb(var(--text-faint))]"
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h3 className="font-semibold">{spec.label}</h3>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.07em]",
                                empty
                                  ? "bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent-text))]"
                                  : fill?.endingSoon.length
                                    ? "bg-amber-500/14 text-amber-700 dark:text-amber-400"
                                    : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                              )}
                            >
                              {empty ? "Available" : fill?.summary}
                            </span>
                            {guide.value !== "standard" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.07em] text-[rgb(var(--label))]">
                                <Sparkles className="size-3" aria-hidden />
                                {VALUE_LABELS[guide.value]}
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">
                            {guide.where}
                          </p>

                          <p className="mt-2 text-[12px] text-[rgb(var(--text-faint))]">
                            {capacityLabel(spec.value)}
                            {!empty && fill && (
                              <>
                                <span className="mx-2" aria-hidden>
                                  ·
                                </span>
                                {fill.all.length} booking{fill.all.length === 1 ? "" : "s"} in
                                total
                              </>
                            )}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ── View 2: every booking ────────────────────────────────────────────────── */

function ListView({
  banners,
  total,
  query,
  setQuery,
  filter,
  setFilter,
  rowProps,
  counts,
}: {
  banners: AdBanner[];
  total: number;
  query: string;
  setQuery: (v: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  rowProps: (b: AdBanner) => {
    position: number;
    isFirst: boolean;
    isLast: boolean;
    ordered: boolean;
    onPreview: (b: AdBanner) => void;
  };
  counts: Record<Filter, number>;
}) {
  // Grouped by placement so the running order on screen is the running order a
  // reader sees — which is the only order the reorder arrows make sense in.
  const groups = BANNER_PLACEMENTS.map((spec) => ({
    spec,
    rows: banners.filter((b) => b.placement === spec.value),
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--text-faint))]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an advertiser or a slot"
            aria-label="Search bookings"
            className="h-11 w-full rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] pl-10 pr-4 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                filter === key
                  ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent-text))]"
                  : "border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] hover:border-[rgb(var(--text-faint))] hover:text-[rgb(var(--text))]"
              )}
            >
              {label}
              <span className="tabular-nums opacity-60">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[13px] text-[rgb(var(--text-faint))]">
        Showing {banners.length} of {total} bookings.
      </p>

      {banners.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[rgb(var(--hairline))] px-6 py-12 text-center text-[14px] text-[rgb(var(--text-muted))]">
          Nothing matches that. Clear the search or pick another filter.
        </p>
      ) : (
        <div className="mt-6 space-y-9">
          {groups.map(({ spec, rows }) => (
            <section key={spec.value}>
              <header className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[rgb(var(--hairline))] pb-2.5">
                <h2 className="font-semibold">{spec.label}</h2>
                <p className="text-[12px] text-[rgb(var(--text-faint))]">
                  {capacityLabel(spec.value)}
                </p>
              </header>
              <div className="space-y-3">
                {rows.map((b) => (
                  <BookingRow key={b.id} banner={b} showPlacement={false} {...rowProps(b)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── View 3: the schedule ─────────────────────────────────────────────────── */

/** How far forward the timeline looks. Beyond this a bar simply runs off. */
const WINDOW_DAYS = 90;
const LOOKBACK_DAYS = 14;

function ScheduleView({
  banners,
  onPreview,
}: {
  banners: AdBanner[];
  onPreview: (b: AdBanner) => void;
}) {
  const now = new Date();
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 86400000);
  const span = (LOOKBACK_DAYS + WINDOW_DAYS) * 86400000;

  // Anything a reader could still meet, soonest to finish first. A booking
  // already over is not a schedule, it is history, and sits at the bottom.
  const runningOrComing = banners
    .filter((b) => ["live", "scheduled"].includes(bannerState(b)))
    .sort((a, b) => {
      const left = daysRemaining(a);
      const right = daysRemaining(b);
      if (left === null && right === null) return a.client_name.localeCompare(b.client_name);
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    });

  const over = banners.filter((b) => bannerState(b) === "expired");
  const paused = banners.filter((b) => bannerState(b) === "hidden");

  function bar(banner: AdBanner) {
    const from = banner.starts_at ? new Date(banner.starts_at).getTime() : start.getTime();
    const to = banner.expires_at
      ? new Date(banner.expires_at).getTime()
      : start.getTime() + span;

    const left = Math.max(0, ((from - start.getTime()) / span) * 100);
    const right = Math.min(100, ((to - start.getTime()) / span) * 100);
    return { left, width: Math.max(1.5, right - left), openEnded: !banner.expires_at };
  }

  const todayAt = ((now.getTime() - start.getTime()) / span) * 100;

  return (
    <div className="mt-7">
      <p className="max-w-2xl text-[14.5px] leading-relaxed text-[rgb(var(--text-muted))]">
        Every booking that is running or about to, soonest to finish first. The
        line marks today; a bar that fades out to the right has no end date and
        will keep running until somebody stops it.
      </p>

      {runningOrComing.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[rgb(var(--hairline))] px-6 py-12 text-center text-[14px] text-[rgb(var(--text-muted))]">
          Nothing is running or scheduled.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))]">
          <div className="hidden border-b border-[rgb(var(--hairline))] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.09em] text-[rgb(var(--text-faint))] sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_120px]">
            <span>Advertiser</span>
            <span>
              {formatDate(start, { month: "short", year: undefined })} →{" "}
              {formatDate(new Date(start.getTime() + span), { month: "short", year: undefined })}
            </span>
            <span className="text-right">Runs out</span>
          </div>

          <ul className="divide-y divide-[rgb(var(--hairline))]">
            {runningOrComing.map((b) => {
              const { left, width, openEnded } = bar(b);
              const soon = isEndingSoon(b);

              return (
                <li
                  key={b.id}
                  className="grid items-center gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_120px] sm:gap-4"
                >
                  <button
                    type="button"
                    onClick={() => onPreview(b)}
                    className="min-w-0 cursor-pointer text-left"
                  >
                    <span className="block truncate text-[13.5px] font-semibold">
                      {b.client_name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-[rgb(var(--text-faint))]">
                      {placementSpec(b.placement).label}
                    </span>
                  </button>

                  <div className="relative h-6 rounded-full bg-[rgb(var(--surface-2))]">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 w-px bg-[rgb(var(--text-faint))]/70"
                      style={{ left: `${todayAt}%` }}
                    />
                    <span
                      className={cn(
                        "absolute inset-y-1 rounded-full",
                        soon
                          ? "bg-amber-500/70"
                          : bannerState(b) === "scheduled"
                            ? "bg-sky-500/60"
                            : "bg-[rgb(var(--accent))]/65",
                        openEnded &&
                          "[mask-image:linear-gradient(to_right,black_60%,transparent_100%)]"
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>

                  <p
                    className={cn(
                      "text-[12.5px] sm:text-right",
                      soon
                        ? "font-semibold text-amber-700 dark:text-amber-400"
                        : "text-[rgb(var(--text-muted))]"
                    )}
                  >
                    {runsOutLabel(b)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(paused.length > 0 || over.length > 0) && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <QuietList
            title="Paused"
            body="Switched off by hand. Nothing to do with dates — turn one back on from the list."
            banners={paused}
          />
          <QuietList
            title="Finished"
            body="Their end date has passed. Give them a new one to run them again, or delete them."
            banners={over}
          />
        </div>
      )}
    </div>
  );
}

function QuietList({
  title,
  body,
  banners,
}: {
  title: string;
  body: string;
  banners: AdBanner[];
}) {
  if (banners.length === 0) return null;

  return (
    <section className="rounded-lg border border-[rgb(var(--hairline))] p-5">
      <h3 className="font-semibold">
        {title}
        <span className="ml-2 font-normal tabular-nums text-[rgb(var(--text-faint))]">
          {banners.length}
        </span>
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">{body}</p>
      <ul className="mt-3 space-y-1.5">
        {banners.map((b) => (
          <li key={b.id}>
            <Link
              href={`/admin/banners/${b.id}/edit`}
              className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-[rgb(var(--surface-2))]"
            >
              <span className="truncate font-medium">{b.client_name}</span>
              <span className="shrink-0 text-[12px] text-[rgb(var(--text-faint))]">
                {placementSpec(b.placement).label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Small furniture ──────────────────────────────────────────────────────── */

function Figure({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "plain" | "good" | "warn" | "sell";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        tone === "warn"
          ? "border-amber-500/35 bg-amber-500/8"
          : tone === "sell"
            ? "border-[rgb(var(--accent))]/25 bg-[rgb(var(--accent))]/6"
            : "border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))]"
      )}
    >
      <p className="label-eyebrow text-[10px] text-[rgb(var(--text-faint))]">{label}</p>
      <p
        className={cn(
          "mt-3 font-display text-3xl tabular-nums",
          tone === "good" && "text-emerald-700 dark:text-emerald-400",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
          tone === "sell" && "text-[rgb(var(--accent-text))]"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[12px] text-[rgb(var(--text-faint))]">{hint}</p>}
    </div>
  );
}

function Tab({
  active,
  onClick,
  Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
        active
          ? "border-[rgb(var(--accent))] text-[rgb(var(--text))]"
          : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[rgb(var(--surface-2))] px-2 py-0.5 text-[11px] tabular-nums text-[rgb(var(--text-faint))]">
      {children}
    </span>
  );
}
