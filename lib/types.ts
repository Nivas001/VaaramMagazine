export type Publication = {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  description: string | null;
  edition: string;
  edition_date: string;
  pdf_url: string;
  pdf_key: string;
  file_size_bytes: number | null;
  total_pages: number | null;
  cover_url: string | null;
  is_published: boolean;
  view_count: number;
  download_count: number;
};

export type AdBanner = {
  id: string;
  created_at: string;
  client_name: string;
  target_url: string | null;
  /** Desktop artwork. Required, and the fallback for every other device. */
  image_url: string;
  image_key: string | null;
  /** Optional artwork for the middle range. Falls back to desktop. */
  image_url_tablet: string | null;
  image_key_tablet: string | null;
  /** Optional artwork for phones. Falls back to tablet, then desktop. */
  image_url_mobile: string | null;
  image_key_mobile: string | null;
  placement: BannerPlacement;
  edition: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  impressions: number;
  clicks: number;
};

/**
 * Where a paid banner can appear on the website.
 *
 * The values are stored in the database as plain text, so a placement may be
 * added here freely — but never rename or remove one without migrating the
 * rows that already use it, or those banners will simply stop rendering.
 */
export type BannerPlacement =
  | "home_hero"
  | "home_mid"
  | "home_feature"
  | "home_closing"
  | "listing_top"
  | "listing_inline"
  | "reader_top"
  | "reader_sidebar"
  | "reader_below"
  | "footer";

export type BannerShape = "leaderboard" | "banner" | "inline" | "sidebar" | "square";

/** The three device tiers a banner can carry its own artwork for. */
export type DeviceTier = "desktop" | "tablet" | "mobile";

export const DEVICE_TIERS: {
  tier: DeviceTier;
  label: string;
  range: string;
  required: boolean;
}[] = [
  { tier: "desktop", label: "Desktop", range: "1024px and wider", required: true },
  { tier: "tablet", label: "Tablet & laptop", range: "640 – 1023px", required: false },
  { tier: "mobile", label: "Phone", range: "under 640px", required: false },
];

/**
 * What each slot looks like, per device.
 *
 * A wide strip cannot simply be scaled down: a 1600 × 200 leaderboard on a
 * 375px phone would be 47px tall and unreadable. So every shape declares a
 * different proportion per tier, and an advertiser can supply artwork drawn
 * for each one. The class string is written out literally because Tailwind
 * reads these at build time and cannot see a value assembled at runtime.
 */
export const SHAPE_SPECS: Record<
  BannerShape,
  { className: string; sizes: Record<DeviceTier, { w: number; h: number }> }
> = {
  leaderboard: {
    className: "aspect-[2/1] sm:aspect-[24/5] lg:aspect-[8/1] min-h-[76px]",
    sizes: { desktop: { w: 1600, h: 200 }, tablet: { w: 1200, h: 250 }, mobile: { w: 800, h: 400 } },
  },
  banner: {
    className: "aspect-[2/1] sm:aspect-[24/5] lg:aspect-[6/1] min-h-[88px]",
    sizes: { desktop: { w: 1200, h: 200 }, tablet: { w: 1200, h: 250 }, mobile: { w: 800, h: 400 } },
  },
  inline: {
    className: "aspect-[8/5] sm:aspect-[4/1] lg:aspect-[24/5] min-h-[110px]",
    sizes: { desktop: { w: 1200, h: 250 }, tablet: { w: 1200, h: 300 }, mobile: { w: 800, h: 500 } },
  },
  sidebar: {
    className: "aspect-[5/3] lg:aspect-[6/5] min-h-[200px]",
    sizes: { desktop: { w: 600, h: 500 }, tablet: { w: 1000, h: 600 }, mobile: { w: 1000, h: 600 } },
  },
  square: {
    className: "aspect-square min-h-[220px]",
    sizes: { desktop: { w: 800, h: 800 }, tablet: { w: 800, h: 800 }, mobile: { w: 800, h: 800 } },
  },
};

/** "1600 × 200 px" — the hint shown next to an upload zone. */
export function sizeHint(shape: BannerShape, tier: DeviceTier) {
  const { w, h } = SHAPE_SPECS[shape].sizes[tier];
  return `${w} × ${h} px`;
}

/**
 * The artwork a given device should get, falling back up the chain so a banner
 * with only desktop artwork still renders everywhere.
 */
export function bannerArtwork(banner: AdBanner) {
  const desktop = banner.image_url;
  const tablet = banner.image_url_tablet || desktop;
  const mobile = banner.image_url_mobile || tablet;
  return { desktop, tablet, mobile };
}

export const BANNER_PLACEMENTS: {
  value: BannerPlacement;
  label: string;
  hint: string;
  /** The artwork proportion this slot renders at. */
  shape: BannerShape;
}[] = [
  {
    value: "home_hero",
    label: "Home — under the hero",
    hint: "Wide strip, best at 1600 × 200 px",
    shape: "leaderboard",
  },
  {
    value: "home_mid",
    label: "Home — mid page",
    hint: "Wide banner, best at 1200 × 250 px",
    shape: "inline",
  },
  {
    value: "home_feature",
    label: "Home — feature block",
    hint: "Large panel, best at 1200 × 500 px",
    shape: "banner",
  },
  {
    value: "home_closing",
    label: "Home — above the closing call",
    hint: "Wide banner, best at 1200 × 200 px",
    shape: "banner",
  },
  {
    value: "listing_top",
    label: "Archive — above the editions",
    hint: "Wide strip, best at 1600 × 200 px",
    shape: "leaderboard",
  },
  {
    value: "listing_inline",
    label: "Archive — between editions",
    hint: "Wide banner, best at 1200 × 200 px",
    shape: "banner",
  },
  {
    value: "reader_top",
    label: "Reader — above the pages",
    hint: "Wide strip, best at 1600 × 200 px",
    shape: "leaderboard",
  },
  {
    value: "reader_sidebar",
    label: "Reader — beside the pages",
    hint: "Upright panel, best at 600 × 500 px",
    shape: "sidebar",
  },
  {
    value: "reader_below",
    label: "Reader — under the pages",
    hint: "Wide banner, best at 1200 × 250 px",
    shape: "inline",
  },
  {
    value: "footer",
    label: "Every page — above the footer",
    hint: "Wide banner, best at 1200 × 200 px",
    shape: "banner",
  },
];

export type Enquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string;
  edition: string | null;
  category: string | null;
  subject: string;
  message: string;
  source: string;
  status: "new" | "contacted" | "closed";
};

export type Subscriber = {
  id: string;
  created_at: string;
  email: string;
  /** Where the address was collected, so a list can be traced back. */
  source: string;
  is_active: boolean;
  unsubscribed_at: string | null;
};
