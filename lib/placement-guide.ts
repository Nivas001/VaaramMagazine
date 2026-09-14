import {
  AD_FORMATS,
  BANNER_PLACEMENTS,
  placementSpec,
  type BannerPlacement,
} from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHERE EVERY AD SLOT ACTUALLY SITS ON THE WEBSITE
 *
 *  lib/types.ts answers "how does this slot render?" — one at a time, all of
 *  them, in a grid. It deliberately says nothing about *which page* a slot is
 *  on or *what a reader sees around it*, because the public site does not need
 *  to know: a page imports the slot it wants and that is the whole contract.
 *
 *  The admin needs exactly the opposite. Someone selling a slot has to be able
 *  to answer, out loud, on the phone: "that one is the wide strip across the
 *  very top of the home page, above the headline — the first thing anyone
 *  sees." That sentence does not exist anywhere in the codebase, so it lives
 *  here, once, and both the admin screens and the printed advertising manual
 *  are generated from it.
 *
 *  Keep it honest. Every line here is read out to a paying advertiser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The four wireframes the admin draws. A slot belongs to exactly one. */
export type SitePageKey = "home" | "archive" | "reader" | "everywhere";

export const SITE_PAGES: {
  key: SitePageKey;
  /** Heading shown above the wireframe. */
  label: string;
  /** One line under the heading. */
  lead: string;
  /** Where an admin can go and look at the real thing. */
  href: string;
}[] = [
  {
    key: "home",
    label: "Home page",
    lead: "The page almost every visitor lands on first, and the one with the most slots on it.",
    href: "/",
  },
  {
    key: "archive",
    label: "Archive",
    lead: "Where readers browse back through every edition ever published.",
    href: "/archives",
  },
  {
    key: "reader",
    label: "Edition reader",
    lead: "The page an edition opens in. Readers stay here longest, so a slot here is seen for longer.",
    href: "/archives",
  },
  {
    key: "everywhere",
    label: "Every page",
    lead: "Slots that are not tied to one page — they follow the reader around the whole site.",
    href: "/",
  },
];

export type PlacementGuide = {
  /** Which wireframe this slot is drawn on. */
  page: SitePageKey;
  /** Plain English: what a reader is looking at when they meet this slot. */
  where: string;
  /** What happens to it on a phone, which is where most readers are. */
  onPhone: string;
  /** Anywhere else the same booking also turns up. */
  alsoAppears?: string;
  /**
   * How many advertisements are on screen at once.
   *
   * A number is a hard count of frames — book more than this and they take
   * turns. `null` means the slot simply grows: every booking is on the page,
   * one under another, with no ceiling.
   */
  frames: number | null;
  /** Roughly what this slot is worth, in the seller's own words. */
  value: "premium" | "strong" | "standard";
};

export const PLACEMENT_GUIDE: Record<BannerPlacement, PlacementGuide> = {
  home_top: {
    page: "home",
    where:
      "A wide strip across the very top of the home page, above the headline and above the week's cover. The first advertisement anyone sees.",
    onPhone: "Stays at the top, full width, about 64px tall.",
    frames: 1,
    value: "premium",
  },
  hero_left: {
    page: "home",
    where:
      "Two tall upright towers running down the left of the opening screen, beside the headline.",
    onPhone:
      "The towers come out of the side and join the compact advertisement block under the hero.",
    frames: 2,
    value: "premium",
  },
  hero_right: {
    page: "home",
    where:
      "Four cards stacked down the right of the opening screen, beside the week's cover.",
    onPhone:
      "The cards come out of the side and join the compact advertisement block under the hero.",
    frames: 4,
    value: "premium",
  },
  home_hero: {
    page: "home",
    where:
      "A wide strip directly under the opening screen — the first slot a reader meets after scrolling.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "strong",
  },
  home_mid: {
    page: "home",
    where:
      "A wide strip halfway down the home page, just after the section explaining what Vaaram is.",
    onPhone: "Full width, in the same position.",
    alsoAppears: "The same booking also runs on the About page.",
    frames: 1,
    value: "strong",
  },
  home_feature: {
    page: "home",
    where:
      "A wide strip in the feature block between the two halves of the home page. The most room a single advertiser gets on the site.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "strong",
  },
  home_closing: {
    page: "home",
    where:
      "The last wide strip on the home page, just above the closing “get your business discovered” panel.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "standard",
  },
  site_rail: {
    page: "everywhere",
    where:
      "The main side rail — a standing column of cards down the left of the home page and the archive, beside the content.",
    onPhone:
      "There is no room for a column, so the same cards are dealt into the page a couple at a time as the reader scrolls. Every booking still appears, in the same order, at full width.",
    alsoAppears:
      "It also tops up the reader's own rail when that one is short, so a booking here can appear beside an edition too.",
    frames: null,
    value: "strong",
  },
  reader_rail: {
    page: "reader",
    where:
      "A standing column of cards beside the pages of an edition — on screen for as long as somebody is reading.",
    onPhone: "Falls below the edition. Someone who opened an edition came to read it first.",
    frames: null,
    value: "premium",
  },
  listing_top: {
    page: "archive",
    where: "A wide strip above the archive browser, before the first cover.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "standard",
  },
  listing_inline: {
    page: "archive",
    where: "A wide strip dealt into the archive's cover grid, after the eighth edition.",
    onPhone: "Full width, threaded into the same grid.",
    frames: 1,
    value: "standard",
  },
  reader_top: {
    page: "reader",
    where:
      "A wide strip directly above the pages of an edition — the last thing a reader passes before they start reading.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "premium",
  },
  reader_below: {
    page: "reader",
    where:
      "A wide strip directly under the edition, seen by someone who has just finished reading it.",
    onPhone: "Full width, in the same position.",
    frames: 1,
    value: "standard",
  },
  footer: {
    page: "everywhere",
    where:
      "A wrapping grid of cards above the footer on every single page of the website — home, archive, about, contact and every edition.",
    onPhone: "Two cards across instead of four. Every booking still appears.",
    frames: null,
    value: "standard",
  },
  reader_sidebar: {
    page: "reader",
    where:
      "Retired. Nothing new can be booked here, but bookings already made still appear inside the reader's side rail.",
    onPhone: "Same as the reader side rail.",
    frames: null,
    value: "standard",
  },
};

export function placementGuide(placement: BannerPlacement) {
  return PLACEMENT_GUIDE[placement] ?? PLACEMENT_GUIDE.site_rail;
}

/** Every bookable slot on one page of the site, in the order a reader meets them. */
export function placementsOnPage(page: SitePageKey) {
  return BANNER_PLACEMENTS.filter((p) => !p.legacy && placementGuide(p.value).page === page);
}

/**
 * "Two frames · cards" — the one-line shape of a slot, for a list row.
 */
export function capacityLabel(placement: BannerPlacement) {
  const spec = placementSpec(placement);
  const { frames } = placementGuide(placement);
  const format = AD_FORMATS[spec.format].label.toLowerCase();

  if (frames === null) return `Unlimited · every booking on screen · ${format}s`;
  if (frames === 1) return `One frame · they take turns · ${format}`;
  return `${frames} frames · they take turns · ${format}s`;
}

/** A short, sellable name for the value tier. */
export const VALUE_LABELS: Record<PlacementGuide["value"], string> = {
  premium: "Premium",
  strong: "Strong",
  standard: "Standard",
};
