import { placementGuide } from "@/lib/placement-guide";
import { placementSpec, type AdBanner, type BannerPlacement } from "@/lib/types";

/**
 * What state a booking is actually in, worked out once.
 *
 * Four separate columns decide whether a reader can see an advertisement —
 * `is_active`, `starts_at`, `expires_at` and nothing else — and every screen
 * that shows a banner was re-deriving that from scratch, slightly differently.
 * One function, one vocabulary, so the list, the inventory board and the
 * alerts can never disagree about whether something is running.
 */

export type BannerState =
  /** On the website right now. */
  | "live"
  /** Booked, artwork in, but its start date has not arrived. */
  | "scheduled"
  /** Its end date has passed — a reader no longer sees it. */
  | "expired"
  /** Switched off by hand. Nothing to do with dates. */
  | "hidden";

export const STATE_LABELS: Record<BannerState, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Finished",
  hidden: "Paused",
};

/** Ends within this many days and the admin is warned about it. */
export const ENDING_SOON_DAYS = 14;

export function bannerState(banner: AdBanner, now = new Date()): BannerState {
  if (!banner.is_active) return "hidden";
  if (banner.expires_at && new Date(banner.expires_at) < now) return "expired";
  if (banner.starts_at && new Date(banner.starts_at) > now) return "scheduled";
  return "live";
}

/**
 * Whole days until this booking stops running, or null when it has no end
 * date at all. Negative once it is over.
 *
 * Counted from the start of today rather than from this instant, so a banner
 * ending tonight reads as "ends today" all day instead of flipping to
 * "ends in 0 days" after breakfast.
 */
export function daysRemaining(banner: AdBanner, now = new Date()): number | null {
  if (!banner.expires_at) return null;
  const end = new Date(banner.expires_at);
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.round((endDay - startOfToday) / 86400000);
}

/** Running now, and finishing inside the warning window. */
export function isEndingSoon(banner: AdBanner, now = new Date()) {
  if (bannerState(banner, now) !== "live") return false;
  const left = daysRemaining(banner, now);
  return left !== null && left >= 0 && left <= ENDING_SOON_DAYS;
}

/** "Ends today", "3 days left", "Ran out 2 days ago", "No end date". */
export function runsOutLabel(banner: AdBanner, now = new Date()) {
  const left = daysRemaining(banner, now);
  if (left === null) return "No end date";
  if (left < -1) return `Finished ${Math.abs(left)} days ago`;
  if (left === -1) return "Finished yesterday";
  if (left === 0) return "Ends today";
  if (left === 1) return "Ends tomorrow";
  return `${left} days left`;
}

export function clickRate(banner: AdBanner) {
  if (!banner.impressions) return 0;
  return (banner.clicks / banner.impressions) * 100;
}

/* ── Slot occupancy ───────────────────────────────────────────────────────
   The question an administrator actually asks before quoting a price: is
   there room in this slot, and if not, when does room come free?            */

export type SlotFill = {
  placement: BannerPlacement;
  /** Every booking made against the slot, in running order. */
  all: AdBanner[];
  live: AdBanner[];
  scheduled: AdBanner[];
  expired: AdBanner[];
  hidden: AdBanner[];
  endingSoon: AdBanner[];
  /** How many advertisements are on screen at once. Null = no ceiling. */
  frames: number | null;
  /** Frames with nothing in them. Null for an unlimited slot. */
  freeFrames: number | null;
  /** More booked than there are frames, so they rotate. */
  rotating: boolean;
  state: "empty" | "space" | "full" | "rotating" | "unlimited";
  /** The headline sentence on the inventory board. */
  summary: string;
};

export function slotFill(
  placement: BannerPlacement,
  banners: AdBanner[],
  now = new Date()
): SlotFill {
  const all = banners.filter((b) => b.placement === placement);
  const live = all.filter((b) => bannerState(b, now) === "live");
  const scheduled = all.filter((b) => bannerState(b, now) === "scheduled");
  const expired = all.filter((b) => bannerState(b, now) === "expired");
  const hidden = all.filter((b) => bannerState(b, now) === "hidden");
  const endingSoon = live.filter((b) => isEndingSoon(b, now));

  const { frames } = placementGuide(placement);
  const spec = placementSpec(placement);
  const noun = spec.mode === "carousel" ? "frame" : "space";

  if (frames === null) {
    return {
      placement,
      all,
      live,
      scheduled,
      expired,
      hidden,
      endingSoon,
      frames: null,
      freeFrames: null,
      rotating: false,
      state: live.length === 0 ? "empty" : "unlimited",
      summary:
        live.length === 0
          ? "Empty — room for any number"
          : `${live.length} running · room for any number more`,
    };
  }

  const freeFrames = Math.max(0, frames - live.length);
  const rotating = live.length > frames;

  const state: SlotFill["state"] =
    live.length === 0 ? "empty" : rotating ? "rotating" : freeFrames > 0 ? "space" : "full";

  const summary =
    live.length === 0
      ? `Empty — ${frames} ${noun}${frames === 1 ? "" : "s"} free`
      : rotating
        ? `${live.length} sharing ${frames} ${noun}${frames === 1 ? "" : "s"}`
        : freeFrames > 0
          ? `${live.length} of ${frames} ${noun}s taken · ${freeFrames} free`
          : `Full — ${frames} of ${frames} ${noun}${frames === 1 ? "" : "s"} taken`;

  return {
    placement,
    all,
    live,
    scheduled,
    expired,
    hidden,
    endingSoon,
    frames,
    freeFrames,
    rotating,
    state,
    summary,
  };
}
