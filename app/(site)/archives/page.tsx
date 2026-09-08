import type { Metadata } from "next";
import { getPublications } from "@/lib/queries";
import { ArchiveBrowser } from "@/components/archive/ArchiveBrowser";
import { InlineAd } from "@/components/ads/AdSlot";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Section";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archives — every weekly edition",
  description:
    "Browse every edition of Vaaram Magazine. Read any week online or download the PDF — free, with no sign-up.",
  alternates: { canonical: "/archives" },
};

export default async function ArchivesPage() {
  const publications = await getPublications();

  return (
    <Section className="!pt-14 sm:!pt-20">
      <header className="max-w-2xl">
        <Eyebrow>Archives</Eyebrow>
        <h1 className="display-xl mt-5">Every week. One archive.</h1>
        <p className="lead mt-6">
          Every edition Vaaram has published, kept online and free to read. Browse the
          covers, scan the list, or find a week on the calendar.
        </p>
      </header>

      <div className="mt-12 sm:mt-16">
        <ArchiveBrowser
          publications={publications}
          inlineAd={<InlineAd placement="listing_inline" />}
        />
      </div>
    </Section>
  );
}
