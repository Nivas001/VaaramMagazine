import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getPublications } from "@/lib/queries";
import { siteConfig } from "@/site.config";
import { PublicationCard } from "@/components/site/PublicationCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { Eyebrow, Section } from "@/components/ui/Bento";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Issues — Download Every Weekly PDF",
  description:
    "Browse and download every issue of our free weekly broadsheet. Read past weeks online or download the print edition.",
  alternates: { canonical: "/editions" },
};

export default async function EditionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>;
}) {
  const { edition } = await searchParams;
  const active = siteConfig.editions.find((e) => e.slug === edition)?.slug;
  const publications = await getPublications({ edition: active });

  return (
    <>
      <Section className="!pb-8">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>ARCHIVE</Eyebrow>
            <h1 className="mt-5 font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-wide text-neutral-900 dark:text-white">
              EVERY ISSUE, <span className="text-[#cd2129]">ALWAYS FREE</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
              Browse any back issue online in our reader, or download the original
              print-quality PDF to keep.
            </p>
          </div>
        </Reveal>

        {/* Edition filter (only shown if multiple editions exist) */}
        {siteConfig.editions.length > 1 && (
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <FilterPill href="/editions" label="All editions" active={!active} />
              {siteConfig.editions.map((e) => (
                <FilterPill
                  key={e.slug}
                  href={`/editions?edition=${e.slug}`}
                  label={e.name}
                  native={e.nativeName}
                  active={active === e.slug}
                />
              ))}
            </div>
          </Reveal>
        )}
      </Section>

      <Section className="!pt-0">
        {publications.length === 0 ? (
          <Reveal>
            <div className="mx-auto max-w-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-12 text-center shadow-xs">
              <FileText className="mx-auto size-10 stroke-[1.5] text-neutral-400 dark:text-neutral-500" />
              <h2 className="mt-5 font-display text-2xl uppercase tracking-wider text-neutral-900 dark:text-white">
                NO ISSUES PUBLISHED YET
              </h2>
              <p className="mt-2.5 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                The current edition will appear here as soon as it is released. Check back
                shortly, or get in touch with our publishing desk.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex h-11 items-center bg-[#cd2129] px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
              >
                CONTACT DESK
              </Link>
            </div>
          </Reveal>
        ) : (
          <>
            <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publications.slice(0, 6).map((publication) => (
                <RevealItem key={publication.id} className="h-full">
                  <PublicationCard publication={publication} />
                </RevealItem>
              ))}
            </RevealGroup>

            {publications.length > 6 && (
              <>
                <AdSlot placement="listing_inline" edition={active} className="my-12" />
                <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {publications.slice(6).map((publication) => (
                    <RevealItem key={publication.id} className="h-full">
                      <PublicationCard publication={publication} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              </>
            )}
          </>
        )}
      </Section>
    </>
  );
}

function FilterPill({
  href,
  label,
  native,
  active,
}: {
  href: string;
  label: string;
  native?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 font-display text-xs uppercase tracking-widest transition-all",
        active
          ? "bg-[#cd2129] text-white shadow-xs font-normal"
          : "border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-700 dark:text-neutral-400 hover:text-[#cd2129] dark:hover:text-white hover:border-neutral-400 shadow-2xs"
      )}
    >
      {label}
      {native && <span className="opacity-70">{native}</span>}
    </Link>
  );
}
