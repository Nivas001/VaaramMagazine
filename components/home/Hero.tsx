import Link from "next/link";
import { ArrowRight, BookOpen, Download } from "lucide-react";
import type { Publication } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { formatBytes, formatDate } from "@/lib/utils";
import { CoverFlip } from "@/components/home/CoverFlip";
import { VaaramMark } from "@/components/site/VaaramMark";

/**
 * The home page opens on the current edition.
 *
 * The band is built as a masthead rather than a marketing hero: an issue line
 * ruled across the top the way a magazine prints one, the tagline set as the
 * headline it already is, and the week's magazine standing in front of the two
 * editions before it — which says "this comes out every week" far faster than
 * a sentence claiming so.
 *
 * The band pulls itself up behind the sticky header with a negative margin, so
 * the navigation floats over the dark ground rather than sitting on a seam.
 */
export function Hero({
  publication,
  previous = [],
}: {
  publication: Publication | null;
  /** The editions before this one, shown stacked behind the cover. */
  previous?: Publication[];
}) {
  const issueLine = [
    publication?.title,
    publication ? formatDate(publication.edition_date) : null,
    siteConfig.contact.address,
  ].filter(Boolean) as string[];

  return (
    <section
      className="on-wine relative isolate -mt-16 overflow-hidden bg-warm-950 text-warm-50 sm:-mt-[72px]"
      aria-labelledby="hero-heading"
    >
      <HeroGround />

      <div className="mx-auto flex min-h-[min(900px,100svh)] max-w-[88rem] flex-col px-5 pb-12 pt-[104px] sm:px-8 sm:pb-16 sm:pt-[128px]">
        {/* ── Masthead rule ─────────────────────────────────────────────── */}
        <div className="hidden items-center gap-5 border-b border-white/12 pb-4 md:flex">
          <VaaramMark className="size-5 shrink-0" />
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {issueLine.map((entry, i) => (
              <li key={entry} className="label-eyebrow flex items-center gap-4 whitespace-nowrap text-warm-400">
                {i > 0 && <span className="h-px w-4 bg-white/20" aria-hidden />}
                {entry}
              </li>
            ))}
          </ul>
          <span className="label-eyebrow ml-auto whitespace-nowrap text-gold-soft">Free to read</span>
        </div>

        <div className="grid flex-1 items-center gap-y-14 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-x-16 xl:gap-x-24">
          {/* ── Words ───────────────────────────────────────────────────── */}
          <div className="max-w-[36rem]">
            <div className="animate-rise" style={{ animationDelay: "0.04s" }}>
              <LiveBadge publication={publication} />
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.1s" }}>
              <h1 id="hero-heading" className="display-hero mt-7 text-warm-50 sm:mt-8">
                Discover.
                <br />
                Connect.
                <br />
                <span className="relative inline-block text-gold-soft">
                  Every week.
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-gold-soft/70 to-transparent sm:-bottom-2"
                  />
                </span>
              </h1>
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.18s" }}>
              <p className="mt-8 max-w-[30rem] text-[16.5px] leading-[1.65] text-warm-300 sm:text-[18px]">
                A weekly advertising magazine. One new edition every week gathers the
                businesses, services, property, jobs and offers near you into a single
                issue — free to read, no sign-up, on any phone.
              </p>
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.26s" }}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={publication ? `/archives/${publication.slug}` : "/archives"}
                  className="group inline-flex h-[54px] items-center gap-2.5 rounded-full bg-wine px-7 text-[15px] font-semibold text-white shadow-[0_12px_34px_-14px_rgba(195,49,80,0.95)] transition-colors hover:bg-wine-soft"
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
                  className="inline-flex h-[54px] items-center rounded-full border border-white/22 px-7 text-[15px] font-semibold text-warm-100 transition-colors hover:border-white/50 hover:bg-white/[0.06]"
                >
                  Advertise with us
                </Link>
              </div>
            </div>

            {publication && (
              <div className="animate-rise" style={{ animationDelay: "0.34s" }}>
                <dl className="mt-11 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/[0.07]">
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

          {/* ── The magazine on its shelf ────────────────────────────────── */}
          {publication && (
            <div
              className="animate-rise flex justify-center lg:justify-end"
              style={{ animationDelay: "0.16s" }}
            >
              <CoverFlip publication={publication} previous={previous} />
            </div>
          )}
        </div>

        {/* ── What is inside, set as a contents line ───────────────────── */}
        <div
          className="animate-rise mt-auto border-t border-white/12 pt-5"
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
            "radial-gradient(56% 60% at 76% 38%, rgba(195,49,80,0.26) 0%, rgba(195,49,80,0) 68%)," +
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
