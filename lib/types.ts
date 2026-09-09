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
  image_url: string;
  image_key: string | null;
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

/** The proportion each shape renders at, shared by the slot and the carousel. */
export const SHAPE_ASPECTS: Record<BannerShape, string> = {
  leaderboard: "aspect-[1600/200] min-h-[76px]",
  banner: "aspect-[1200/200] min-h-[88px]",
  inline: "aspect-[1200/250] min-h-[110px]",
  sidebar: "aspect-[6/5] min-h-[200px]",
  square: "aspect-square min-h-[220px]",
};

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
