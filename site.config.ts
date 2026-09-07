/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIGURATION
 *  This is the ONLY file you need to edit to re-brand the whole website.
 *  Change the text here and every page, the SEO tags and the footer update.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const siteConfig = {
  /** Short brand name shown in the navbar and footer. */
  name: "Vaaram Magazine",
  /** Legal / long name used in SEO and structured data. */
  legalName: "Vaaram Magazine Publishing",
  /** One-line tagline under the logo. */
  tagline: "Discover. Connect. Every week.",
  /** Used for <title> templates and Open Graph. */
  description:
    "Vaaram Magazine — Discover. Connect. Every week. Canada's premier weekly community broadsheet and digital magazine. Free to read online or download as PDF.",
  /** Production URL, no trailing slash. Also set NEXT_PUBLIC_SITE_URL in .env. */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.vaaram.ca",
  /** Year the publication started — shown in the stats strip. */
  since: "2018",
  locale: "en_CA",

  contact: {
    email: "contact@vaaram.ca",
    /** Full international format, used for the tel: link. */
    phone: "+1 647 555 0199",
    /** Digits only, no +, no spaces — used to build the wa.me link. */
    whatsapp: "16475550199",
    address: "Toronto, Ontario, Canada · Digital Worldwide",
    /** Human-readable office hours shown on the contact page. */
    hours: "Monday – Saturday, 9:00 AM – 7:00 PM EST",
  },

  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    x: "https://x.com",
  },

  /**
   * The editions you publish. `slug` must match the `edition` value you pick
   * when uploading in the admin dashboard, so keep these stable.
   */
  editions: [
    {
      slug: "weekly",
      name: "Weekly",
      nativeName: "வாரம்",
      blurb: "The complete weekly digital magazine, broadsheet listings, and community news.",
      accent: "violet" as const,
    },
  ],

  /** Headline numbers on the home page. Plain numbers only — the UI animates them. */
  stats: [
    { value: 1200, suffix: "+", label: "Classifieds every week" },
    { value: 240000, suffix: "+", label: "Monthly digital readers" },
    { value: 52, suffix: "", label: "Issues every year" },
    { value: 100, suffix: "%", label: "Free to read & download" },
  ],

  /** The "How we work" steps on the About page. */
  process: [
    {
      title: "Submit your feature or ad",
      body: "Call, WhatsApp or submit via our booking desk. Share your copy, images, and category preferences.",
    },
    {
      title: "Editorial layout & proof",
      body: "Our production desk typesets your feature into the upcoming edition and sends you a press proof for approval.",
    },
    {
      title: "Weekly Sunday publication",
      body: "Every Sunday at 6:00 AM, the new issue goes live across www.vaaram.ca as a full interactive reader and print-ready PDF.",
    },
    {
      title: "Global reader discovery",
      body: "Thousands of readers view, bookmark, and download the paper completely free on any smartphone, tablet, or desktop.",
    },
  ],

  /** Ad categories listed on the Advertise page. */
  categories: [
    "Community & Announcements",
    "Real Estate & Housing",
    "Careers & Employment",
    "Business & Trade",
    "Automotive & Vehicles",
    "Arts, Culture & Cinema",
    "Education & Training",
    "Professional & Home Services",
    "Health & Wellness",
    "Matrimony & Personal",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type EditionSlug = (typeof siteConfig.editions)[number]["slug"];

/** Look up an edition definition by its slug. */
export function getEdition(slug: string) {
  return siteConfig.editions.find((e) => e.slug === slug);
}

/** Pre-filled WhatsApp deep link. */
export function whatsappLink(message = "Hello, I would like to place an ad.") {
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
