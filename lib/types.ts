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

export type BannerPlacement =
  | "home_hero"
  | "home_mid"
  | "listing_inline"
  | "reader_sidebar"
  | "footer";

export const BANNER_PLACEMENTS: { value: BannerPlacement; label: string; hint: string }[] = [
  { value: "home_hero", label: "Home — below hero", hint: "Wide banner, best at 1200 × 200 px" },
  { value: "home_mid", label: "Home — mid page", hint: "Wide banner, best at 1200 × 250 px" },
  { value: "listing_inline", label: "Archive — between issues", hint: "Wide banner, 1200 × 200 px" },
  { value: "reader_sidebar", label: "Reader — beside the PDF", hint: "Square-ish, 600 × 500 px" },
  { value: "footer", label: "Every page — above footer", hint: "Wide banner, 1200 × 200 px" },
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
  status: "new" | "contacted" | "closed";
};
