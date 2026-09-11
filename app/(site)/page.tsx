import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBanners, getLatestPublication, getPublications } from "@/lib/queries";
import { Hero } from "@/components/home/Hero";
import { WhatIsVaaram } from "@/components/home/WhatIsVaaram";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AdvertiseShowcase } from "@/components/home/AdvertiseShowcase";
import { PublicationStats } from "@/components/home/PublicationStats";
import { SubscribeBand } from "@/components/home/SubscribeBand";
import { LatestEdition } from "@/components/magazine/LatestEdition";
import { EditionCard } from "@/components/magazine/EditionCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { RailLayout } from "@/components/ads/RailLayout";
import { Rule, Section } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export const revalidate = 60;

export default async function HomePage() {
  const [latest, recent, all, rail] = await Promise.all([
    getLatestPublication(),
    getPublications({ limit: 5 }),
    getPublications(),
    getBanners("site_rail"),
  ]);

  // The hero already carries the current edition, so the strip below shows
  // only what came before it.
  const previous = recent.filter((p) => p.id !== latest?.id).slice(0, 4);

  // One fetch, split between the page's two railed stretches so the running
  // order carries straight down the page rather than restarting halfway.
  const railTop = rail.slice(0, 5);
  const railRest = rail.slice(5);

  return (
    <>
      <Hero publication={latest} />

      {/* A leaderboard directly under the hero — the first paid slot a reader
          meets, and the one advertisers ask for by name. */}
      <Section className="!py-9">
        <AdSlot placement="home_hero" />
      </Section>

      {/* ── First railed region ────────────────────────────────────────────
          The rail cannot simply wrap the whole page: the grey band below and
          the wine call to action at the foot both run edge to edge, and a
          full-bleed band cannot sit inside a bounded column. So the page is
          railed in two stretches with the band left untouched between them,
          which keeps its existing order exactly as it was. */}
      <Section className="!pb-0 !pt-4">
        <RailLayout banners={railTop} showTail={false}>
          {latest ? <LatestEdition publication={latest} /> : <></>}
          <Rule />
          <WhatIsVaaram />
          <div className="py-9">
            <AdSlot placement="home_mid" />
          </div>
        </RailLayout>
      </Section>

      <div className="bg-[rgb(var(--surface-2))]">
        <Section>
          <HowItWorks />
        </Section>
      </div>

      {/* ── Second railed region ───────────────────────────────────────── */}
      <Section className="!pb-10">
        <RailLayout banners={railRest}>
          <AdvertiseShowcase />

          {/* The feature slot: a full-width panel between the two halves of
              the page, where a sponsor gets the most room this site sells. */}
          <div className="py-9">
            <AdSlot placement="home_feature" />
          </div>

          {all.length > 0 ? <PublicationStats publications={all} /> : <></>}

          {previous.length > 0 ? (
            <div className="pt-10">
              <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-[rgb(var(--hairline))] pb-7">
                <div>
                  <h2 className="display-md">Previous editions</h2>
                  <p className="mt-2.5 text-[15px] text-[rgb(var(--text-muted))]">
                    Every edition stays online. Nothing is taken down.
                  </p>
                </div>
                <Link
                  href="/archives"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))] underline decoration-[rgb(var(--hairline))] underline-offset-[6px] transition-colors hover:text-[rgb(var(--accent-text))] hover:decoration-[rgb(var(--accent))]"
                >
                  Browse the full archive
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Reveal>

              {/* Three across rather than four: the content column is narrower
                  now that the rail sits beside it. */}
              <RevealGroup className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 lg:grid-cols-3">
                {previous.map((publication) => (
                  <RevealItem key={publication.id} className="h-full">
                    <EditionCard publication={publication} />
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          ) : (
            <></>
          )}

          <div className="pt-6">
            <SubscribeBand source="home" />
          </div>

          <div className="py-9">
            <AdSlot placement="home_closing" />
          </div>
        </RailLayout>
      </Section>

      {/* ── Closing call to action ─────────────────────────────────────── */}
      <div className="on-wine bg-warm-950 text-warm-50">
        <Section className="text-center">
          <Reveal>
            <h2 className="display-xl mx-auto max-w-2xl text-warm-50">
              Get your business discovered.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-warm-300">
              Tell us what you want to advertise and we will put it in front of the
              people already looking for it — in the next edition.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-wine px-7 text-[15px] font-semibold text-white transition-colors hover:bg-wine-soft"
              >
                Contact us
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/about"
                className="inline-flex h-[52px] items-center rounded-full border border-white/20 px-7 text-[15px] font-semibold text-warm-100 transition-colors hover:border-white/45 hover:bg-white/[0.06]"
              >
                How Vaaram works
              </Link>
            </div>
          </Reveal>
        </Section>
      </div>
    </>
  );
}
