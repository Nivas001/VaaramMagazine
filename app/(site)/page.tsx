import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestPublication, getPublications } from "@/lib/queries";
import { siteConfig } from "@/site.config";
import { Hero } from "@/components/home/Hero";
import { WhatIsVaaram } from "@/components/home/WhatIsVaaram";
import { AdvertiseShowcase } from "@/components/home/AdvertiseShowcase";
import { LatestEdition } from "@/components/magazine/LatestEdition";
import { EditionCard } from "@/components/magazine/EditionCard";
import { BannerAd, InlineAd } from "@/components/ads/AdSlot";
import { Section, Rule } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export const revalidate = 60;

export default async function HomePage() {
  const [latest, recent] = await Promise.all([
    getLatestPublication(),
    getPublications({ limit: 5 }),
  ]);

  // The hero already carries the current edition, so the strip below shows
  // only what came before it.
  const previous = recent.filter((p) => p.id !== latest?.id).slice(0, 4);

  return (
    <>
      <Hero publication={latest} />

      <Section className="!py-10">
        <BannerAd placement="home_hero" />
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

      <Section className="!py-10">
        <InlineAd placement="home_mid" />
      </Section>

      <div className="bg-[rgb(var(--surface-2))]">
        <Section>
          <AdvertiseShowcase />
        </Section>
      </div>

      {previous.length > 0 && (
        <Section>
          <Reveal className="flex flex-wrap items-end justify-between gap-6 border-b border-[rgb(var(--hairline))] pb-7">
            <div>
              <h2 className="display-md">Previous editions</h2>
              <p className="mt-2.5 text-[15px] text-[rgb(var(--text-muted))]">
                Every edition stays online. Nothing is taken down.
              </p>
            </div>
            <Link
              href="/archives"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))] underline decoration-[rgb(var(--hairline))] underline-offset-[6px] transition-colors hover:text-[rgb(var(--accent))] hover:decoration-[rgb(var(--accent))]"
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

      {/* ── Closing call to action ─────────────────────────────────────── */}
      <div className="bg-warm-950 text-warm-50">
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
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-ember px-7 text-[15px] font-semibold text-white transition-colors hover:bg-ember-soft"
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
