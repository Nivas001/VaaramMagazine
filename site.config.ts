/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VAARAM MAGAZINE — SITE CONFIGURATION
 *
 *  This is the only file you need to edit to change the words, the contact
 *  details and the publishing rhythm of the whole website.
 *
 *  Anything marked PLACEHOLDER is deliberately fake and must be replaced with
 *  the real detail before the site goes live.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const siteConfig = {
  name: "Vaaram Magazine",
  /** Tamil for "week" — used as the secondary wordmark. */
  nativeName: "வாரம்",
  legalName: "Vaaram Magazine",
  tagline: "Discover. Connect. Every week.",

  description:
    "Vaaram Magazine is a weekly advertising and classifieds publication. Every week a new edition brings local businesses, services, property, jobs and offers to readers across Canada — free to read online as a PDF.",

  /** Short line used in the hero and meta descriptions. */
  shortDescription:
    "A weekly advertising and classifieds magazine. One new edition every week — free to read.",

  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.vaaram.ca",
  locale: "en_CA",
  /** Dates, numbers and currency all follow Canadian conventions. */
  dateLocale: "en-CA",

  /** The day a new edition goes live. 0 = Sunday … 6 = Saturday. */
  publishDay: 0,
  publishDayLabel: "Sunday",

  contact: {
    email: "contact@vaaram.ca",
    /** PLACEHOLDER — 555 numbers are reserved and can never connect. */
    phone: "+1 647 555 0199",
    /** PLACEHOLDER — digits only, used to build the wa.me deep link. */
    whatsapp: "16475550199",
    /** PLACEHOLDER — replace with the real street address. */
    address: "Toronto, Ontario, Canada",
    hours: "Monday – Saturday, 9:00 AM – 6:00 PM ET",
  },

  social: {
    facebook: "",
    instagram: "",
    youtube: "",
  },

  /**
   * The publication ticker. These are publication and advertising messages,
   * never headlines — Vaaram is not a news outlet.
   */
  ticker: [
    "This week's edition is now live",
    "Discover. Connect. Every week.",
    "New week · new edition",
    "Advertise with Vaaram Magazine",
    "Discover local businesses, services & opportunities",
    "Read this week's Vaaram",
  ],

  /**
   * What actually appears inside the magazine. Keep this honest — every
   * category here is presented to readers as something they will find.
   */
  categories: [
    { name: "Businesses", blurb: "Shops, trades and local firms introducing themselves." },
    { name: "Services", blurb: "Professionals, repairs, care and everyday help." },
    { name: "Property", blurb: "Homes and commercial space to rent or buy." },
    { name: "Jobs", blurb: "Vacancies and hiring notices from local employers." },
    { name: "Offers", blurb: "Weekly promotions, discounts and seasonal deals." },
    { name: "Community", blurb: "Events, classes, notices and announcements." },
  ],

  /** How an advertisement becomes an edition. Used on the About page. */
  process: [
    {
      title: "Advertise",
      body: "You send us your advertisement — a business, a service, a property, a vacancy or an offer.",
    },
    {
      title: "Curate",
      body: "We lay it out, group it with the right section and send you a proof to approve.",
    },
    {
      title: "Publish",
      body: "Your advertisement goes into the week's edition, published as a complete PDF.",
    },
    {
      title: "Discover",
      body: "Readers open the edition on this site, free, on any phone or computer.",
    },
    {
      title: "Connect",
      body: "They call, message or visit you — the whole point of being in the magazine.",
    },
  ],

  /** Why a business should be in the weekly edition. About page. */
  reasons: [
    {
      title: "A publication people choose to open",
      body: "Readers come to Vaaram looking for something. Your advertisement is what they came to find, not something interrupting them.",
    },
    {
      title: "One edition, one week",
      body: "A fresh edition every week keeps the magazine current, and gives your advertisement a clear, predictable run.",
    },
    {
      title: "Free for every reader",
      body: "Nothing sits between your advertisement and the person reading it — no paywall, no sign-up, no app.",
    },
    {
      title: "Kept in the archive",
      body: "Every edition stays online. Readers browse back through past weeks long after publication day.",
    },
  ],

  /**
   * The questions asked most often before someone gets in touch. They appear
   * on the Contact page and are published as FAQ structured data, so keep
   * every answer true — a search engine will quote it verbatim.
   */
  faq: [
    {
      question: "How much does it cost to advertise?",
      answer:
        "It depends on the size you book — from a few classified lines up to a full page. Tell us roughly what you have in mind and we will quote for it; there is no standing rate card on the site because the price moves with the season and the section.",
    },
    {
      question: "What do I need to send you?",
      answer:
        "Whatever you already have. A logo, some photos and the words you want to say is plenty — we set the advertisement for you and send a proof back to approve before anything is published.",
    },
    {
      question: "When is the deadline for next week's edition?",
      answer:
        "Anything approved before Sunday goes into that week's edition. If it is close to the day, call us — we will tell you honestly whether it will make it.",
    },
    {
      question: "Do readers have to pay or sign up?",
      answer:
        "No. Every edition is free to read on this site and free to download as a PDF. There is no account, no paywall and no app.",
    },
    {
      question: "How long does my advertisement stay online?",
      answer:
        "Permanently. Your advertisement runs in one week's edition, and that edition stays in the archive — so it is still there, and still findable, long after publication day.",
    },
    {
      question: "Can I advertise on the website as well as in the magazine?",
      answer:
        "Yes. Banner slots on the home page, the archive and the reader are sold separately from space inside the printed edition. Ask us for what is free.",
    },
  ],

  /**
   * Editions the publication runs. `slug` must match the value chosen when
   * publishing an issue in the admin dashboard, so keep these stable.
   */
  editions: [
    {
      slug: "weekly",
      name: "Weekly",
      blurb: "The complete weekly advertising and classifieds edition.",
    },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type EditionSlug = (typeof siteConfig.editions)[number]["slug"];

export function getEdition(slug: string) {
  return siteConfig.editions.find((e) => e.slug === slug);
}

/** Pre-filled WhatsApp deep link. Returns null when no number is configured. */
export function whatsappLink(message = "Hello Vaaram Magazine, I'd like to advertise.") {
  if (!siteConfig.contact.whatsapp) return null;
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
