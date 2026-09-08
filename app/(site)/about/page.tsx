import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/site.config";
import { DiscoveryToConnection } from "@/components/about/DiscoveryToConnection";
import { Section, Eyebrow, SectionHeading } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { InlineAd } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "About — what Vaaram Magazine is",
  description:
    "Vaaram Magazine is a weekly advertising and classifieds publication. Here is how the weekly edition works, who advertises in it, and how readers find them.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      {/* ── 1. Opening statement ───────────────────────────────────────── */}
      <div className="bg-warm-950 text-warm-50">
        <Section className="!pb-16 !pt-20 sm:!pt-28">
          <div className="max-w-3xl">
            <Eyebrow className="!text-brass-soft">About Vaaram</Eyebrow>
            <h1 className="display-hero mt-7 text-warm-50">
              Discover. Connect.
              <br />
              <span className="text-ember-soft">Every week.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-warm-300 sm:text-lg">
              Vaaram is a weekly advertising magazine. It exists for one reason: to put
              the businesses, services and opportunities near you in front of the people
              already looking for them.
            </p>
          </div>
        </Section>
      </div>

      {/* ── 2. What Vaaram is ──────────────────────────────────────────── */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="What it is"
              title="A magazine made entirely of advertisements — on purpose."
            />
          </Reveal>

          <Reveal delay={0.08} className="space-y-6 text-[17px] leading-relaxed text-[rgb(var(--text-muted))]">
            <p>
              Most publications sell advertising around their content. Vaaram has no
              content to sell around: the advertisements <em>are</em> the publication.
              That sounds like a limitation until you notice it is exactly why people
              open it.
            </p>
            <p>
              Nobody reads Vaaram by accident. They open it because they want a
              plumber, a flat, a job, a weekend offer, or to know which shop just
              opened nearby. Every page answers that.
            </p>
            <p>
              A new edition is published every {siteConfig.publishDayLabel} as a complete
              PDF. It is free, it needs no account, and every past edition stays online.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── 3. The 3D journey: discovery to connection ─────────────────── */}
      <DiscoveryToConnection />

      {/* ── 4. How it works ────────────────────────────────────────────── */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="Five steps, every week."
            lead="The same rhythm since the first edition — and the reason advertisers know exactly what they are buying."
          />
        </Reveal>

        <RevealGroup as="ol" className="mt-14 border-t border-[rgb(var(--hairline))]">
          {siteConfig.process.map((step, i) => (
            <RevealItem
              as="li"
              key={step.title}
              className="grid gap-3 border-b border-[rgb(var(--hairline))] py-8 sm:grid-cols-[auto_minmax(0,14rem)_minmax(0,1fr)] sm:items-baseline sm:gap-10"
            >
              <span className="font-display text-2xl text-[rgb(var(--accent))] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-2xl tracking-[-0.025em] sm:text-[28px]">
                {step.title}
              </h3>
              <p className="max-w-lg text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                {step.body}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ── 5. Who it is for ───────────────────────────────────────────── */}
      <div className="bg-[rgb(var(--surface-2))]">
        <Section>
          <Reveal>
            <SectionHeading
              eyebrow="Who advertises"
              title="Anyone with something local to offer."
              lead="These are the sections a reader turns to — and the businesses that fill them."
            />
          </Reveal>

          <RevealGroup as="ul" className="mt-14 grid gap-px overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--hairline))] sm:grid-cols-2 lg:grid-cols-3">
            {siteConfig.categories.map((category) => (
              <RevealItem
                as="li"
                key={category.name}
                className="bg-[rgb(var(--surface-3))] p-8"
              >
                <h3 className="font-display text-2xl tracking-[-0.02em]">{category.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                  {category.blurb}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      </div>

      <Section className="!py-10">
        <InlineAd placement="home_mid" />
      </Section>

      {/* ── 6. Why Vaaram ──────────────────────────────────────────────── */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="Why be in it"
            title="What a weekly edition does for a business."
          />
        </Reveal>

        <RevealGroup className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {siteConfig.reasons.map((reason) => (
            <RevealItem key={reason.title}>
              <h3 className="font-display text-[26px] leading-tight tracking-[-0.025em]">
                {reason.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                {reason.body}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* ── 7. Closing call to action ──────────────────────────────────── */}
      <div className="bg-warm-950 text-warm-50">
        <Section className="text-center">
          <Reveal>
            <h2 className="display-xl mx-auto max-w-2xl text-warm-50">
              Get your business discovered.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-warm-300">
              Tell us what you would like to advertise. We will lay it out, show you a
              proof, and run it in the next edition.
            </p>
            <Link
              href="/contact"
              className="mt-9 inline-flex h-[52px] items-center gap-2.5 rounded-full bg-ember px-8 text-[15px] font-semibold text-white transition-colors hover:bg-ember-soft"
            >
              Contact us
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </Section>
      </div>
    </>
  );
}
