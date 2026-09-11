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
  /** Absent on rows written before banners became editable. */
  updated_at?: string | null;
};

/**
 * Where a paid banner can appear on the website.
 *
 * The values are stored in the database as plain text, so a placement may be
 * added here freely — but never rename or remove one without migrating the
 * rows that already use it, or those banners will simply stop rendering.
 */
export type BannerPlacement =
  // Side rails — unlimited, ordered by sort_order.
  | "site_rail"
  | "reader_rail"
  // Wide strips — one at a time, rotating.
  | "home_hero"
  | "home_mid"
  | "home_feature"
  | "home_closing"
  | "listing_top"
  | "listing_inline"
  | "reader_top"
  | "reader_below"
  // A wrapping grid above the footer, on every page.
  | "footer"
  // Retired, but never removed: rows booked against it still render, folded
  // into the reader rail. Hidden from the admin's dropdown.
  | "reader_sidebar";

/**
 * How a placement renders the banners booked against it.
 *
 *   · "carousel" — one at a time, rotating. For a single wide strip.
 *   · "stack"    — every banner, one under another. This is what makes a rail
 *                  hold any number of advertisements.
 *   · "grid"     — every banner, wrapping across columns.
 */
export type AdRenderMode = "carousel" | "stack" | "grid";

/**
 * The two artwork proportions the whole site sells.
 *
 * The proportion is deliberately CONSTANT at every screen size. That is the
 * entire reason an advertiser supplies one file instead of three: only the
 * column width changes between a phone and a desktop, never the shape, so one
 * image fits everywhere. (The shape system this replaced declared a different
 * ratio at each breakpoint, which no single image can satisfy — which is why
 * it demanded three uploads per banner.)
 *
 * The class strings are written out literally because Tailwind reads them at
 * build time and cannot see a value assembled at runtime.
 */
export type AdFormat = "card" | "strip";

export const AD_FORMATS: Record<
  AdFormat,
  {
    label: string;
    /** A constant aspect ratio — no breakpoint variants, by design. */
    className: string;
    /** Written onto the <img> as literal attributes, so nothing shifts on load. */
    width: number;
    height: number;
    hint: string;
  }
> = {
  card: {
    label: "Card",
    className: "aspect-[2/1]",
    width: 1200,
    height: 600,
    hint: "1200 × 600 px — a 2:1 rectangle. Every side-rail and footer advertisement uses this one size.",
  },
  strip: {
    label: "Wide strip",
    className: "aspect-[11/2]",
    width: 1650,
    height: 300,
    hint: "1650 × 300 px — a wide billboard. On a phone this is only about 64px tall, so use a logo and three or four words. Never a phone number.",
  },
};

/** "1200 × 600 px" — the short size shown beside an upload zone. */
export function formatSize(format: AdFormat) {
  const { width, height } = AD_FORMATS[format];
  return `${width} × ${height} px`;
}

/**
 * The artwork a given device should get, falling back up the chain so a banner
 * with only one image still renders everywhere.
 *
 * With a constant proportion per format, one image is now the normal case and
 * all three of these resolve to it — <picture> then behaves as a plain <img>.
 * The tier columns stay for the rows booked before the change, and as an
 * escape hatch for an advertiser who insists on separate phone artwork.
 */
export function bannerArtwork(banner: AdBanner) {
  const desktop = banner.image_url;
  const tablet = banner.image_url_tablet || desktop;
  const mobile = banner.image_url_mobile || tablet;
  return { desktop, tablet, mobile };
}

export type PlacementGroup = "Side rails" | "Wide strips" | "Footer" | "Retired";

export const BANNER_PLACEMENTS: {
  value: BannerPlacement;
  label: string;
  hint: string;
  /** Groups the admin's dropdown, so like sits with like. */
  group: PlacementGroup;
  /** Whether this slot shows one advertisement or all of them. */
  mode: AdRenderMode;
  /** The artwork proportion this slot renders at. */
  format: AdFormat;
  /** Hidden from the admin's dropdown; existing rows still render. */
  legacy?: true;
}[] = [
  {
    value: "site_rail",
    label: "Side rail — every page",
    hint: "The main rail. Holds any number of advertisements, in the order you set, beside the content on home and the archive.",
    group: "Side rails",
    mode: "stack",
    format: "card",
  },
  {
    value: "reader_rail",
    label: "Side rail — beside the reader",
    hint: "Beside the pages of an edition, where readers spend the longest. Tops up from the every-page rail when it is short.",
    group: "Side rails",
    mode: "stack",
    format: "card",
  },

  {
    value: "home_hero",
    label: "Home — under the hero",
    hint: "The first strip a reader meets.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "home_mid",
    label: "Home — mid page",
    hint: "Also used on the About page.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "home_feature",
    label: "Home — feature block",
    hint: "Between the two halves of the home page.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "home_closing",
    label: "Home — above the closing call",
    hint: "The last strip before the closing call to action.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "listing_top",
    label: "Archive — above the editions",
    hint: "Above the archive browser.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "listing_inline",
    label: "Archive — between editions",
    hint: "After the eighth cover in the archive grid.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "reader_top",
    label: "Reader — above the pages",
    hint: "The last thing a reader passes before they start reading.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },
  {
    value: "reader_below",
    label: "Reader — under the pages",
    hint: "Directly under the edition they have just read.",
    group: "Wide strips",
    mode: "carousel",
    format: "strip",
  },

  {
    value: "footer",
    label: "Every page — above the footer",
    hint: "A wrapping grid of cards at the foot of every page. Holds any number.",
    group: "Footer",
    mode: "grid",
    format: "card",
  },

  {
    value: "reader_sidebar",
    label: "Reader — beside the pages (retired)",
    hint: "Replaced by the reader side rail. Bookings made here still appear inside that rail.",
    group: "Retired",
    mode: "stack",
    format: "card",
    legacy: true,
  },
];

/** The spec for a placement, or the site rail's if the value is unknown. */
export function placementSpec(placement: BannerPlacement) {
  return (
    BANNER_PLACEMENTS.find((p) => p.value === placement) ?? BANNER_PLACEMENTS[0]
  );
}

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
