import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Publication } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { formatDate, freshness } from "@/lib/utils";
import { MagazineCover } from "@/components/magazine/MagazineCover";

/**
 * The home page opens on the current edition, presented as a physical object
 * under studio light. A visitor should know what Vaaram is, see this week's
 * magazine, and be one click from reading it — without scrolling.
 *
 * The band pulls itself up behind the sticky header with a negative margin, so
 * the navigation floats over the dark ground rather than sitting on a seam.
 */
export function Hero({ publication }: { publication: Publication | null }) {
  return (
    <section
      className="relative isolate -mt-16 overflow-hidden bg-warm-950 text-warm-50 sm:-mt-[72px]"
      aria-labelledby="hero-heading"
    >
      {/* Studio lighting: one warm key light behind the magazine, one cool
          fill on the opposite side. Both are pure CSS gradients — no images,
          no canvas, nothing to load. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(58% 62% at 74% 42%, rgba(217,86,62,0.20) 0%, rgba(217,86,62,0) 68%)," +
            "radial-gradient(50% 55% at 12% 74%, rgba(156,116,48,0.14) 0%, rgba(156,116,48,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-black/45"
      />

      <div className="mx-auto flex min-h-[min(880px,100svh)] max-w-[88rem] flex-col justify-center px-5 pb-14 pt-24 sm:px-8 sm:pb-24 sm:pt-[136px]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 xl:gap-24">
          {/* ── Words ─────────────────────────────────────────────────── */}
          <div className="max-w-xl">
            <div className="animate-rise" style={{ animationDelay: "0.05s" }}>
              <p className="label-eyebrow flex items-center gap-3 text-brass-soft">
                <span className="h-px w-7 bg-brass-soft/60" aria-hidden />
                This week
                {publication && (
                  <>
                    <span className="text-warm-500" aria-hidden>
                      ·
                    </span>
                    <span className="text-warm-300">{publication.title}</span>
                  </>
                )}
              </p>
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.12s" }}>
              <h1 id="hero-heading" className="display-hero mt-5 text-warm-50 sm:mt-6">
                Discover.
                <br />
                Connect.
                <br />
                <span className="text-ember-soft">Every week.</span>
              </h1>
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.2s" }}>
              <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-warm-300 sm:mt-7 sm:text-lg">
                Vaaram is a weekly advertising magazine. Every {siteConfig.publishDayLabel}, a new
                edition brings local businesses, services, property, jobs and offers together in
                one place — free to read.
              </p>
            </div>

            <div className="animate-rise" style={{ animationDelay: "0.28s" }}>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
                {publication ? (
                  <Link
                    href={`/archives/${publication.slug}`}
                    className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-ember px-7 text-[15px] font-semibold text-white transition-colors hover:bg-ember-soft"
                  >
                    <BookOpen className="size-[18px]" aria-hidden />
                    Read this week&apos;s edition
                  </Link>
                ) : (
                  <Link
                    href="/archives"
                    className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-ember px-7 text-[15px] font-semibold text-white transition-colors hover:bg-ember-soft"
                  >
                    <BookOpen className="size-[18px]" aria-hidden />
                    Browse the archive
                  </Link>
                )}

                <Link
                  href="/archives"
                  className="inline-flex h-[52px] items-center gap-2 rounded-full border border-white/20 px-7 text-[15px] font-semibold text-warm-100 transition-colors hover:border-white/45 hover:bg-white/[0.06]"
                >
                  Browse archives
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>

            {publication && (
              <div className="animate-rise" style={{ animationDelay: "0.36s" }}>
                <dl className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-sm sm:mt-10 sm:pt-6">
                  <div className="flex items-baseline gap-2">
                    <dt className="text-warm-500">Published</dt>
                    <dd className="font-medium text-warm-200">
                      {formatDate(publication.edition_date)}
                    </dd>
                  </div>
                  {publication.total_pages && (
                    <div className="flex items-baseline gap-2">
                      <dt className="text-warm-500">Pages</dt>
                      <dd className="font-medium text-warm-200">{publication.total_pages}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <dt className="sr-only">Availability</dt>
                    <dd className="font-medium text-warm-200">Free to read</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          {/* ── The magazine ──────────────────────────────────────────── */}
          {publication && (
            <div className="animate-rise flex justify-center lg:justify-end" style={{ animationDelay: "0.18s" }}>
              <Link
                href={`/archives/${publication.slug}`}
                aria-label={`Read ${publication.title}`}
                className="group relative block rounded-sm transition-transform duration-500 hover:-translate-y-1.5"
              >
                <MagazineCover publication={publication} size="lg" priority />
                <span className="label-eyebrow mt-7 flex items-center justify-center gap-2.5 text-warm-400 transition-colors group-hover:text-warm-200 lg:justify-end">
                  {freshness(publication.edition_date)}
                  <span className="h-px w-6 bg-current/50" aria-hidden />
                  Open the edition
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
