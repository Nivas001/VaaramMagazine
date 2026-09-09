import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestPublication, getPublications } from "@/lib/queries";
import { siteConfig } from "@/site.config";
import { Hero } from "@/components/home/Hero";
import { WhatIsVaaram } from "@/components/home/WhatIsVaaram";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AdvertiseShowcase } from "@/components/home/AdvertiseShowcase";
import { PublicationStats } from "@/components/home/PublicationStats";
import { SubscribeBand } from "@/components/home/SubscribeBand";
import { LatestEdition } from "@/components/magazine/LatestEdition";
import { EditionCard } from "@/components/magazine/EditionCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { Rule, Section } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export const revalidate = 60;

export default async function HomePage() {
  const [latest, recent, all] = await Promise.all([
    getLatestPublication(),
    getPublications({ limit: 5 }),
    getPublications(),
  ]);

  // The hero already carries the current edition, so the strip below shows
  // only what came before it.
  const previous = recent.filter((p) => p.id !== latest?.id).slice(0, 4);

  return (
    <>
      <Hero publication={latest} previous={previous} />

      {/* A leaderboard directly under the hero — the first paid slot a reader
          meets, and the one advertisers ask for by name. */}
      <Section className="!py-9">
        <AdSlot placement="home_hero" />
      </Section>

      {latest && (
        <Section className="!pt-4">
          <LatestEdition publication={latest} />
        </Section>
      )}

      <Rule />

      <Section>
        <WhatIsVaaram />
      </Section>

      <Section className="!py-9">
        <AdSlot placement="home_mid" />
      </Section>

      <div className="bg-[rgb(var(--surface-2))]">
        <Section>
          <HowItWorks />
        </Section>
      </div>

      <Section>
        <AdvertiseShowcase />
      </Section>

      {/* The feature slot: a full-width panel between the two halves of the
          page, where a sponsor gets the most room this site sells. */}
      <Section className="!py-9">
        <AdSlot placement="home_feature" />
      </Section>

      {all.length > 0 && (
        <Section className="!pt-6">
          <PublicationStats publications={all} />
        </Section>
      )}

      {previous.length > 0 && (
        <Section className="!pt-10">
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

          <RevealGroup className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 lg:grid-cols-4">
            {previous.map((publication) => (
              <RevealItem key={publication.id} className="h-full">
                <EditionCard publication={publication} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      <Section className="!pt-6">
        <SubscribeBand source="home" />
      </Section>

      <Section className="!py-9">
        <AdSlot placement="home_closing" />
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
              people already looking for it — in next {siteConfig.publishDayLabel}&apos;s
              edition.
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
