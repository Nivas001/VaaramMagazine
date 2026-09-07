import Link from "next/link";
import { ArrowRight, BookOpen, Download, Mail, MessageCircle, Newspaper, Sparkles, Users } from "lucide-react";
import { getLatestPerEdition, getPublications } from "@/lib/queries";
import { siteConfig, whatsappLink } from "@/site.config";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { PublicationCard } from "@/components/site/PublicationCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { BentoCard, Eyebrow, Section, SectionHeading } from "@/components/ui/Bento";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";

export const revalidate = 60;

const pillars = [
  {
    number: "01",
    Icon: BookOpen,
    title: "100% Free to Read & Download",
    body: "Every Sunday at 6:00 AM, the new edition arrives online. Open our mobile-optimized digital broadsheet or download the complete press-ready PDF with zero paywalls.",
    ctaLabel: "BROWSE ALL ISSUES",
    ctaHref: "/editions",
  },
  {
    number: "02",
    Icon: Newspaper,
    title: "Community & Classifieds",
    body: "Over 350+ fresh listings every week spanning real estate, job vacancies, business trades, community announcements, cultural notices, and local services.",
    ctaLabel: "EXPLORE DIRECTORY",
    ctaHref: "/advertise",
  },
  {
    number: "03",
    Icon: MessageCircle,
    title: "Zero-Form Ad Booking",
    body: "No registration forms or complicated portals. Message our Toronto desk directly on WhatsApp or Email. We typeset your ad, send you a proof, and publish it this Sunday.",
    ctaLabel: "CHAT ON WHATSAPP",
    ctaHref: whatsappLink("Hello Vaaram Magazine, I want to book an ad for the upcoming Sunday issue."),
    isExternal: true,
  },
];

export default async function HomePage() {
  const [latest, recent] = await Promise.all([
    getLatestPerEdition(),
    getPublications({ limit: 6 }),
  ]);

  const archive = recent.filter((p) => !latest.some((l) => l.id === p.id)).slice(0, 3);

  return (
    <>
      {/* ── 1. Hero: Discover. Connect. Every week. ────────────────────── */}
      <Hero latest={latest} />

      {/* ── 2. Publication Stats ────────────────────────────────────────── */}
      <Section className="!py-6">
        <Stats />
      </Section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="home_hero" />
      </div>

      {/* ── 3. Simple 3-Pillar Overview: What Vaaram Offers ─────────────── */}
      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="SIMPLE & TRUSTED"
            title={
              <>
                HOW VAARAM MAGAZINE <span className="text-[#cd2129]">WORKS FOR YOU</span>
              </>
            }
            lead="Whether you want to read Canada's weekly broadsheet or place a business ad, here is everything you need to know."
          />
        </Reveal>

        <RevealGroup className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map(({ number, Icon, title, body, ctaLabel, ctaHref, isExternal }) => (
            <RevealItem key={title} className="h-full">
              <div className="flex h-full flex-col justify-between border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-7 sm:p-8 shadow-xs hover:border-[#cd2129] hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <span className="font-display text-2xl tracking-wider text-[#cd2129]">
                      {number}
                    </span>
                    <span className="grid size-10 place-items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[#cd2129]">
                      <Icon className="size-5" />
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-2xl uppercase tracking-wider text-neutral-900 dark:text-white">
                    {title}
                  </h3>

                  <p className="mt-3 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {body}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  {isExternal ? (
                    <a
                      href={ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-[#1e8343] dark:text-[#25D366] font-bold hover:underline underline-offset-4"
                    >
                      {ctaLabel} <ArrowRight className="size-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-[#cd2129] font-bold hover:underline underline-offset-4"
                    >
                      {ctaLabel} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="home_mid" />
      </div>

      {/* ── 4. Past Issues Archive ──────────────────────────────────────── */}
      {archive.length > 0 && (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
            <Reveal direction="right">
              <Eyebrow>PREVIOUS ISSUES</Eyebrow>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl uppercase tracking-wide text-neutral-900 dark:text-white">
                RECENT PAST EDITIONS
              </h2>
            </Reveal>
            <Reveal direction="left">
              <ButtonLink href="/editions" variant="outline" size="sm">
                BROWSE FULL ARCHIVE <ArrowRight className="size-3.5" />
              </ButtonLink>
            </Reveal>
          </div>

          <RevealGroup className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {archive.map((publication) => (
              <RevealItem key={publication.id} className="h-full">
                <PublicationCard publication={publication} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      {/* ── 5. Simple Direct Booking Strip (Zero Forms) ─────────────────── */}
      <Section className="!pt-4">
        <Reveal>
          <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] p-8 sm:p-12 shadow-sm">
            <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <Eyebrow>ADVERTISE THIS SUNDAY</Eyebrow>
                <h2 className="mt-4 font-display text-3xl sm:text-4xl uppercase tracking-wide text-neutral-900 dark:text-white">
                  PLACE YOUR AD IN <span className="text-[#cd2129]">THE UPCOMING ISSUE</span>
                </h2>
                <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Every booking gives you dual reach: included in the weekly print-ready PDF downloaded by thousands of readers across Canada and published directly on this site.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={whatsappLink("Hello Vaaram Magazine, I would like to book an ad in this Sunday's issue.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 bg-[#25D366] px-6 font-display text-xs uppercase tracking-wider text-black font-bold hover:bg-[#20ba59] transition-colors"
                  >
                    <MessageCircle className="size-4" /> CHAT ON WHATSAPP
                  </a>
                  <a
                    href={`mailto:${siteConfig.contact.email}?subject=Ad%20Booking%20Enquiry`}
                    className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 font-display text-xs uppercase tracking-wider text-neutral-900 dark:text-white font-bold hover:border-[#cd2129] hover:text-[#cd2129] transition-colors"
                  >
                    <Mail className="size-4" /> EMAIL EDITORIAL DESK
                  </a>
                  <ButtonLink href="/advertise" size="lg" variant="outline">
                    VIEW RATES
                  </ButtonLink>
                </div>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 lg:border-t-0 lg:border-l lg:pl-8">
                <p className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
                  WHY ADVERTISERS CHOOSE VAARAM
                </p>
                <ul className="mt-4 space-y-3 font-sans text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <span className="size-2 bg-[#cd2129] shrink-0" />
                    <span>Dual reach: Print-ready PDF + digital web</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-2 bg-[#cd2129] shrink-0" />
                    <span>Free typesetting &amp; layout proof approval</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-2 bg-[#cd2129] shrink-0" />
                    <span>Over 240,000+ monthly digital impressions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="size-2 bg-[#cd2129] shrink-0" />
                    <span>Closing deadline: Fridays at 5:00 PM EST</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
