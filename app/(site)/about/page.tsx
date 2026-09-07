import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { BentoCard, Eyebrow, Section, SectionHeading } from "@/components/ui/Bento";
import { ButtonLink } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "About Us & How It Works",
  description: `Who we are, why ${siteConfig.name} has been published since ${siteConfig.since}, and how our weekly publishing process works.`,
  alternates: { canonical: "/about" },
};

const values = [
  {
    number: "01",
    title: "Free for readers, always",
    body: "The publication has never charged a reader, and the digital archive never will. Advertisers support the paper so readers can access it freely.",
  },
  {
    number: "02",
    title: "Community focused",
    body: "Every advertisement and notice is from a verified business, individual, or organization. Real listings are what make people read every page.",
  },
  {
    number: "03",
    title: "Editorial verification",
    body: "We review every submission before it goes to layout, ensuring our classified columns maintain trust and high editorial standards.",
  },
  {
    number: "04",
    title: "Dual print & digital reach",
    body: "Your listing appears in the downloadable print-ready PDF and directly on the website for maximum visibility under a single transparent rate.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="!pb-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>ABOUT US</Eyebrow>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-wide text-neutral-900 dark:text-white">
              A TRUSTED PUBLICATION, <span className="text-[#cd2129]">STILL GOING STRONG</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
              {siteConfig.name} has been putting jobs, real estate, vehicles, and
              services in front of readers since {siteConfig.since}. The same trusted format,
              now delivered as an instant, downloadable digital broadsheet.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Story + numbers */}
      <Section className="!pt-2">
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal direction="right" className="lg:col-span-2">
            <div className="h-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-8 sm:p-10 shadow-xs">
              <h2 className="font-display text-2xl uppercase tracking-wider text-neutral-900 dark:text-white sm:text-3xl">
                OUR STORY
              </h2>
              <div className="mt-5 space-y-4 font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                <p>
                  We began as a modest weekly classifieds sheet. The foundational premise was simple
                  and has remained unchanged for decades: give ordinary people, trade professionals,
                  and business owners an accessible, direct channel to communicate.
                </p>
                <p>
                  Decades later, the paper still publishes every single week without fail. What has evolved
                  is how readers access print. We preserve the authentic integrity of the printed broadsheet
                  by providing the complete issue as an optimized, high-fidelity PDF online.
                </p>
                <p>
                  No subscription traps. No forced app installations. Open the website, browse the issue,
                  and keep the PDF.
                </p>
              </div>
              <ButtonLink href="/editions" className="mt-8">
                READ THIS WEEK&apos;S ISSUE
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal direction="left">
            <div className="grid h-full gap-4">
              {siteConfig.stats.slice(0, 3).map((stat) => (
                <div key={stat.label} className="group relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 shadow-xs hover:border-[#cd2129] hover:shadow-md transition-all">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-[#cd2129] transition-colors" />
                  <p className="font-display text-4xl tracking-wider text-neutral-900 dark:text-white group-hover:text-[#cd2129] transition-colors sm:text-5xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 font-sans text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <Section id="how-it-works" className="scroll-mt-28">
        <Reveal>
          <SectionHeading
            eyebrow="PUBLISHING SCHEDULE"
            title={<>FROM SUBMISSION TO <span className="text-[#cd2129]">THE FINAL EDITION</span></>}
            lead="Straightforward process designed for quick, dependable turnaround."
          />
        </Reveal>

        <div className="mt-12 flex flex-col gap-4">
          {siteConfig.process.map((step, i) => (
            <Reveal key={step.title} direction={i % 2 === 0 ? "right" : "left"}>
              <div className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 sm:p-7 shadow-xs hover:border-[#cd2129] transition-all">
                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl tracking-wider text-[#cd2129]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl uppercase tracking-wider text-neutral-900 dark:text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2.5 font-sans text-sm sm:text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="home_mid" />
      </div>

      {/* Values */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="EDITORIAL PRINCIPLES"
            title={<>FOUR STANDARDS WE <span className="text-[#cd2129]">STAND BY</span></>}
          />
        </Reveal>

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2">
          {values.map(({ number, title, body }) => (
            <RevealItem key={title} className="h-full">
              <div className="flex h-full flex-col border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-7 sm:p-8 shadow-xs hover:border-[#cd2129] transition-all">
                <span className="font-display text-2xl tracking-wider text-[#cd2129]">
                  {number}
                </span>
                <h3 className="mt-4 font-display text-xl uppercase tracking-wider text-neutral-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section className="!pt-0">
        <Reveal>
          <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] p-8 text-center sm:p-14 shadow-sm">
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-wide text-neutral-900 dark:text-white">
              READY TO BE IN <span className="text-[#cd2129]">NEXT WEEK&apos;S ISSUE?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
              Submit your advertisement details on WhatsApp or Email and our desk will format and confirm it for inclusion.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/advertise" size="lg">BOOK AN AD</ButtonLink>
              <ButtonLink href="/contact" size="lg" variant="outline">ASK A QUESTION</ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
