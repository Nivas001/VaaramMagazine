import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, FileText, MessageCircle } from "lucide-react";
import { DownloadButton } from "@/components/site/DownloadButton";
import { getPublicationBySlug, getPublications } from "@/lib/queries";
import { getEdition, siteConfig, whatsappLink } from "@/site.config";
import { editionLabel, formatBytes, formatDate } from "@/lib/utils";
import { ReaderMount } from "@/components/reader/ReaderMount";
import { PublicationCard } from "@/components/site/PublicationCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { BentoCard, Section } from "@/components/ui/Bento";
import { ShareButton } from "@/components/site/ShareButton";
import { Reveal } from "@/components/ui/Reveal";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublicationBySlug(slug);
  if (!publication) return { title: "Issue not found" };

  const edition = getEdition(publication.edition);
  const title = `${publication.title} — ${edition?.name ?? publication.edition} Edition`;
  const description =
    publication.description ??
    `Read or download the ${edition?.name ?? publication.edition} broadsheet issue for ${formatDate(
      publication.edition_date
    )}. Free, no sign-up needed.`;

  return {
    title,
    description,
    alternates: { canonical: `/editions/${publication.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: publication.edition_date,
      images: publication.cover_url ? [{ url: publication.cover_url }] : undefined,
    },
  };
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getPublicationBySlug(slug);
  if (!publication) notFound();

  const edition = getEdition(publication.edition);
  const others = (await getPublications({ edition: publication.edition, limit: 4 })).filter(
    (p) => p.id !== publication.id
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    name: publication.title,
    datePublished: publication.edition_date,
    url: `${siteConfig.url}/editions/${publication.slug}`,
    isPartOf: {
      "@type": "Periodical",
      name: `${siteConfig.name} — ${edition?.name ?? publication.edition}`,
      publisher: { "@type": "Organization", name: siteConfig.legalName },
    },
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: publication.pdf_url,
      encodingFormat: "application/pdf",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Section className="!pb-6">
        <Link
          href="/editions"
          className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47] transition-colors hover:text-[#cd2129]"
        >
          <ArrowLeft className="size-4" /> ALL ISSUES
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
              {edition?.name ?? publication.edition} EDITION
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl sm:text-5xl uppercase tracking-wide text-neutral-900 dark:text-white">
              {publication.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-sans text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 stroke-[1.5] text-[#cd2129]" /> {editionLabel(publication.edition_date)}
              </span>
              {publication.total_pages ? (
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-4 stroke-[1.5] text-[#cd2129]" /> {publication.total_pages} PAGES
                </span>
              ) : null}
              {publication.file_size_bytes ? (
                <span>{formatBytes(publication.file_size_bytes)}</span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <DownloadButton
              url={publication.pdf_url}
              publicationId={publication.id}
              className="h-11 bg-[#cd2129] px-6 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
            />
            <ShareButton title={publication.title} />
          </div>
        </div>

        {publication.description && (
          <p className="mt-5 max-w-3xl font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            {publication.description}
          </p>
        )}
      </Section>

      {/* Reader + sponsor rail */}
      <Section className="!pt-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ReaderMount
            url={publication.pdf_url}
            title={publication.title}
            publicationId={publication.id}
          />

          <aside className="flex flex-col gap-5">
            <AdSlot placement="reader_sidebar" edition={publication.edition} />

            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 shadow-xs hover:border-[#cd2129] transition-all">
              <h2 className="font-display text-xl uppercase tracking-wider text-neutral-900 dark:text-white">
                WANT YOUR AD IN HERE?
              </h2>
              <p className="mt-2.5 font-sans text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Book a classified or a display block in next week&apos;s issue. We design the artwork for you.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={whatsappLink(`Hello Vaaram Magazine, I would like to book an ad spot in the upcoming issue.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 bg-[#25D366] font-display text-xs uppercase tracking-wider text-black font-bold hover:bg-[#20ba59] transition-colors"
                >
                  <MessageCircle className="size-4" /> BOOK VIA WHATSAPP
                </a>
                <Link
                  href="/advertise"
                  className="inline-flex h-10 w-full items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 font-display text-xs uppercase tracking-wider text-neutral-800 dark:text-white font-bold hover:border-[#cd2129] transition-colors"
                >
                  RATES &amp; SPECS
                </Link>
              </div>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 shadow-xs">
              <h2 className="font-display text-xs uppercase tracking-widest text-[#b89028] dark:text-[#d2ac47]">
                READING TIPS
              </h2>
              <ul className="mt-3 space-y-2 font-sans text-xs text-neutral-600 dark:text-neutral-400">
                <li>• Swipe left or right to turn pages on mobile.</li>
                <li>• Use arrow keys on a keyboard, or click fullscreen.</li>
                <li>• Use zoom controls to inspect fine print in classifieds.</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      {others.length > 0 && (
        <Section className="!pt-4">
          <Reveal>
            <h2 className="font-display text-2xl sm:text-4xl uppercase tracking-wide text-neutral-900 dark:text-white">
              MORE FROM THE <span className="text-[#cd2129]">{edition?.name ?? publication.edition}</span> EDITION
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 3).map((p) => (
              <PublicationCard key={p.id} publication={p} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
