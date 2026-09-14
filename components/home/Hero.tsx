import Link from "next/link";
import { ArrowRight, BookOpen, Download } from "lucide-react";
import type { AdBanner, Publication } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { EditionFlip } from "@/components/home/EditionFlip";
import { VaaramMark } from "@/components/site/VaaramMark";
import {
  HeroAdsCompact,
  HeroCards,
  HeroLeaderboard,
  HeroTowers,
} from "@/components/ads/HeroAds";

export type HeroAds = {
  /** The leaderboard across the top, above everything. */
  top: AdBanner[];
  /** The towers down the left of the headline. */
  left: AdBanner[];
  /** The cards down the right of the headline. */
  right: AdBanner[];
};

const NO_ADS: HeroAds = { top: [], left: [], right: [] };

/**
 * The home page opens on the current edition, framed by advertising.
 *
 * The band is built as a masthead rather than a marketing hero: an issue line
 * ruled across the top the way a magazine prints one, a leaderboard under it,
 * the tagline set as a heading, and the week's magazine standing in front of
 * the two editions before it — which says "this comes out every week" far
 * faster than a sentence claiming so.
 *
 * ── The shape of the opening screen ───────────────────────────────────────
 * Three columns on a wide screen: towers, content, cards. The rails run the
 * full height of the middle column — the leaderboard sitting above the words
 * and the cover *and* the words-and-cover block underneath it, not just the
 * words alone — the same skyscraper-beside-everything arrangement a
 * newspaper site sells. The leaderboard lives inside that middle column too,
 * rather than spanning the whole hero, so its width matches the content it
 * introduces instead of running wider than what it sits above.
 *
 * Both rails appear together at 1280px and widen again at 1536px. Below that
 * there is no margin left to spare, and they fold into one compact block under
 * the words which keeps the same left-tower / right-cards shape at a size a
 * phone can hold. The two arrangements switch at the same breakpoint quite
 * deliberately: stagger them and a booking falls down the gap between, showing
 * at neither width. Nothing is dropped at any size — every booking renders
 * somewhere, exactly once.
 *
 * The band pulls itself up behind the sticky header with a negative margin, so
 * the navigation floats over the dark ground rather than sitting on a seam.
 */
export function Hero({
  publication,
  ads = NO_ADS,
}: {
  publication: Publication | null;
  ads?: HeroAds;
}) {
  const hasTowers = ads.left.length > 0;
  const hasCards = ads.right.length > 0;

  /**
   * The column template, written out per case rather than assembled.
   *
   * Tailwind reads these strings at build time, so they have to appear
   * literally — and a template that reserved a column for a rail with nothing
   * booked in it would leave a hole down the side of the page.
   */
  const columns =
    hasTowers && hasCards
      ? "xl:grid-cols-[150px_minmax(0,1fr)_260px] 2xl:grid-cols-[210px_minmax(0,1fr)_340px]"
      : hasCards
        ? "xl:grid-cols-[minmax(0,1fr)_260px] 2xl:grid-cols-[minmax(0,1fr)_340px]"
        : hasTowers
          ? "xl:grid-cols-[150px_minmax(0,1fr)] 2xl:grid-cols-[210px_minmax(0,1fr)]"
          : "";

  return (
    <section
      className="on-wine relative isolate -mt-[68px] overflow-hidden bg-warm-950 text-warm-50 sm:-mt-[84px]"
      aria-labelledby="hero-heading"
    >
      <HeroGround />

      <div className="mx-auto flex w-full max-w-[1760px] flex-col px-4 pb-10 pt-[96px] sm:px-6 sm:pb-14 sm:pt-[124px] lg:min-h-[min(880px,100svh)] lg:px-8">
        {/* ── Towers · leaderboard-and-content · cards ─────────────────────
             The two rails are grid items stretched (the default) to the full
             height of this row, which is set by their tallest sibling — the
             middle column carrying the leaderboard and everything under it.
             Each rail then spreads its own frames across that stretched
             height with `justify-between` (see HeroTowers/HeroCards), so a
             reader on a wide screen sees paid advertising run top to bottom
             beside the page rather than sitting in a small centred block. */}
        <div className={cn("grid flex-1 gap-x-8 gap-y-9 pt-8 sm:pt-10", columns)}>
          {hasTowers && (
            <HeroTowers banners={ads.left} className="hidden xl:flex" />
          )}

          <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
            <HeroLeaderboard banners={ads.top} />

            <div className="grid min-w-0 flex-1 items-center gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-x-10 xl:gap-x-14">
            {/* ── Words ─────────────────────────────────────────────────── */}
            <div className="max-w-[34rem]">
              <div className="animate-rise" style={{ animationDelay: "0.04s" }}>
                <LiveBadge publication={publication} />
              </div>

              <div className="animate-rise" style={{ animationDelay: "0.1s" }}>
                {/* Set as a heading rather than a billboard. The motto still
                    opens the page, but the edition beside it and the
                    advertising either side of it are what the page is for. */}
                <h1 id="hero-heading" className="display-lg mt-5 text-warm-50 sm:mt-6">
                  Discover. Connect.{" "}
                  <span className="relative inline-block text-gold-soft">
                    Every week.
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-gold-soft/70 to-transparent"
                    />
                  </span>
                </h1>
              </div>

              <div className="animate-rise" style={{ animationDelay: "0.18s" }}>
                <p className="mt-5 max-w-[30rem] text-[15.5px] leading-[1.65] text-warm-300 sm:text-[16.5px]">
                  A weekly advertising magazine. One new edition every week gathers the
                  businesses, services, property, jobs and offers near you into a single
                  issue — free to read, no sign-up, on any phone.
                </p>
              </div>

              <div className="animate-rise" style={{ animationDelay: "0.26s" }}>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href={publication ? `/archives/${publication.slug}` : "/archives"}
                    className="group inline-flex h-[52px] items-center gap-2.5 rounded-full bg-wine px-6 text-[15px] font-semibold text-white shadow-[0_12px_34px_-14px_rgba(195,49,80,0.95)] transition-colors hover:bg-wine-soft"
                  >
                    <BookOpen className="size-[18px]" aria-hidden />
                    {publication ? "Read this week's edition" : "Browse the archive"}
                    <ArrowRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex h-[52px] items-center rounded-full border border-white/22 px-6 text-[15px] font-semibold text-warm-100 transition-colors hover:border-white/50 hover:bg-white/[0.06]"
                  >
                    Advertise with us
                  </Link>
                </div>
              </div>

              {publication && (
                <div className="animate-rise" style={{ animationDelay: "0.34s" }}>
                  <dl className="mt-8 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/[0.07]">
                    <Spec label="Published" value={formatDate(publication.edition_date)} />
                    <Spec
                      label="Length"
                      value={publication.total_pages ? `${publication.total_pages} pages` : "PDF"}
                    />
                    <Spec
                      label="Download"
                      value={formatBytes(publication.file_size_bytes) ?? "Free"}
                      Icon={Download}
                    />
                  </dl>
                </div>
              )}
            </div>

            {/* ── The magazine on its shelf ──────────────────────────────── */}
            {publication && (
              <div
                className="animate-rise flex flex-col items-center gap-3 lg:items-end"
                style={{ animationDelay: "0.16s" }}
              >
                {/* The issue line sits directly over the cover it describes now,
                    rather than at the top of the page under the navbar — so
                    "published on <date>" reads as a caption for the edition
                    actually shown, not a disconnected banner above the whole
                    hero that a reader has no reason to connect to the cover
                    further down the page. */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 lg:justify-end">
                  <VaaramMark className="size-4 shrink-0 opacity-80" />
                  <span className="label-eyebrow whitespace-nowrap text-warm-300">
                    {publication.title}
                  </span>
                  <span className="h-px w-4 bg-white/20" aria-hidden />
                  <span className="label-eyebrow whitespace-nowrap text-warm-400">
                    Published {formatDate(publication.edition_date)}
                  </span>
                  <span className="h-px w-4 bg-white/20" aria-hidden />
                  <span className="label-eyebrow whitespace-nowrap text-gold-soft">
                    Free to read
                  </span>
                </div>
                <EditionFlip publication={publication} />
              </div>
            )}
            </div>
          </div>

          {hasCards && (
            <HeroCards banners={ads.right} className="hidden xl:flex" />
          )}
        </div>

        {/* ── Both rails, folded in, for everything narrower than xl ────── */}
        <HeroAdsCompact
          towers={ads.left}
          cards={ads.right}
          className="mt-10 xl:hidden"
        />

        {/* ── What is inside, set as a contents line ───────────────────── */}
        <div
          className="animate-rise mt-9 border-t border-white/12 pt-5 lg:mt-auto"
          style={{ animationDelay: "0.42s" }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="label-eyebrow text-gold-soft">Inside</span>
            <ul className="flex flex-wrap items-center gap-2">
              {siteConfig.categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href="/about"
                    className="inline-flex h-8 items-center rounded-full border border-white/14 px-3.5 text-[13px] font-medium text-warm-300 transition-colors hover:border-gold-soft/50 hover:text-warm-50"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Studio lighting. One wine key light behind the magazine, a rose-gold fill on
 * the opposite side, and the faint column rules of a page before anything is
 * set on it. All CSS — no images, nothing to download before the hero paints.
 */
function HeroGround() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(56% 60% at 62% 38%, rgba(195,49,80,0.26) 0%, rgba(195,49,80,0) 68%)," +
            "radial-gradient(48% 52% at 8% 76%, rgba(224,178,155,0.13) 0%, rgba(224,178,155,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "clamp(96px, 12vw, 168px) 100%",
          maskImage: "linear-gradient(to bottom, transparent, black 24%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 24%, black 70%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-black/55"
      />
    </>
  );
}

/** The one status a reader wants before anything else. */
function LiveBadge({ publication }: { publication: Publication | null }) {
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-white/14 bg-white/[0.05] py-1.5 pl-2.5 pr-4">
      <span className="relative grid size-4 shrink-0 place-items-center" aria-hidden>
        <span className="absolute size-4 rounded-full bg-wine-glow/35" />
        <span className="size-1.5 rounded-full bg-wine-glow" />
      </span>
      <span className="label-eyebrow text-warm-200">
        {publication ? "This week's edition is live" : "New edition every week"}
      </span>
    </p>
  );
}

function Spec({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-warm-950/75 px-4 py-3.5">
      <dt className="label-eyebrow flex items-center gap-1.5 text-warm-400">
        {Icon && <Icon className="size-3" aria-hidden />}
        {label}
      </dt>
      <dd className="mt-2 text-[13.5px] font-semibold text-warm-100">{value}</dd>
    </div>
  );
}
