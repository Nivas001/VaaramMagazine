import type { Metadata } from "next";
import { getPublications } from "@/lib/queries";
import { toDate } from "@/lib/utils";
import { ArchiveBrowser } from "@/components/archive/ArchiveBrowser";
import { AdSlot } from "@/components/ads/AdSlot";
import { Section, Eyebrow } from "@/components/ui/Section";
import { StackIllustration } from "@/components/ui/Illustration";
import { SubscribeBand } from "@/components/home/SubscribeBand";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archives — every weekly edition",
  description:
    "Browse every edition of Vaaram Magazine. Read any week online or download the PDF — free, with no sign-up.",
  alternates: { canonical: "/archives" },
};

export default async function ArchivesPage() {
  const publications = await getPublications();

  // The header's three facts are counted from the rows themselves, so they can
  // never claim a run the archive does not actually hold.
  const years = new Set(publications.map((p) => toDate(p.edition_date).getUTCFullYear()));
  const pages = publications.reduce((sum, p) => sum + (p.total_pages ?? 0), 0);

  const facts = [
    { value: publications.length.toLocaleString("en-CA"), label: "Editions online" },
    { value: years.size.toLocaleString("en-CA"), label: years.size === 1 ? "Year" : "Years" },
    ...(pages > 0 ? [{ value: pages.toLocaleString("en-CA"), label: "Pages" }] : []),
  ];

  return (
    <>
      <Section className="!pt-14 sm:!pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)] lg:gap-16">
          <header className="max-w-2xl">
            <Eyebrow>Archives</Eyebrow>
            <h1 className="display-xl mt-5">Every week. One archive.</h1>
            <p className="lead mt-6">
              Every edition Vaaram has published, kept online and free to read. Browse the
              covers, scan the list, or find a week on the calendar.
            </p>

            {publications.length > 0 && (
              <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5 border-t border-[rgb(var(--hairline))] pt-6">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="label-eyebrow text-[rgb(var(--text-faint))]">{fact.label}</dt>
                    <dd className="mt-2 font-display text-[30px] leading-none tracking-[-0.03em] text-[rgb(var(--accent-text))] tabular-nums">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          <div className="hidden justify-end lg:flex">
            <StackIllustration className="max-w-[290px]" />
          </div>
        </div>

        <div className="mt-12">
          <AdSlot placement="listing_top" />
        </div>

        <div className="mt-12 sm:mt-14">
          <ArchiveBrowser
            publications={publications}
            inlineAd={<AdSlot placement="listing_inline" />}
          />
        </div>
      </Section>

      <Section className="!pt-0">
        <SubscribeBand source="archives" />
      </Section>
    </>
  );
}
