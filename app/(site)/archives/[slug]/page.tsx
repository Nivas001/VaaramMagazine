import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, FileText } from "lucide-react";
import { getPublicationBySlug, getPublications } from "@/lib/queries";
import { getEdition, siteConfig } from "@/site.config";
import { editionLabel, formatBytes, formatDate } from "@/lib/utils";
import { ReaderMount } from "@/components/reader/ReaderMount";
import { JsonLd } from "@/components/site/JsonLd";
import { EditionCard } from "@/components/magazine/EditionCard";
import { DownloadButton } from "@/components/site/DownloadButton";
import { ShareButton } from "@/components/site/ShareButton";
import { AdSlot } from "@/components/ads/AdSlot";
import { AdRail } from "@/components/ads/AdRail";
import { Section } from "@/components/ui/Section";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublicationBySlug(slug);
  if (!publication) return { title: "Edition not found" };

  const title = `${publication.title} — ${editionLabel(publication.edition_date)}`;
  const description =
    publication.description ??
    `Read the Vaaram Magazine edition for ${formatDate(publication.edition_date)}. Free, no sign-up.`;

  return {
    title,
    description,
    alternates: { canonical: `/archives/${publication.slug}` },
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
  const size = formatBytes(publication.file_size_bytes);
  const others = (await getPublications({ edition: publication.edition, limit: 5 }))
    .filter((p) => p.id !== publication.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PublicationIssue",
    name: publication.title,
    datePublished: publication.edition_date,
    url: `${siteConfig.url}/archives/${publication.slug}`,
    isPartOf: {
      "@type": "Periodical",
      name: siteConfig.name,
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
      <JsonLd data={jsonLd} />

      <Section width="wide" className="!pb-8 !pt-10">
        <Link
          href="/archives"
          className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All editions
        </Link>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-b border-[rgb(var(--hairline))] pb-8">
          <div className="min-w-0">
            <p className="label-eyebrow text-[rgb(var(--label))]">
              {edition?.name ?? publication.edition} edition
            </p>
            <h1 className="display-lg mt-4">{publication.title}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[rgb(var(--text-muted))]">
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4 text-[rgb(var(--text-faint))]" aria-hidden />
                {editionLabel(publication.edition_date)}
              </span>
              {publication.total_pages && (
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-4 text-[rgb(var(--text-faint))]" aria-hidden />
                  {publication.total_pages} pages
                </span>
              )}
              {size && <span>{size}</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <DownloadButton url={publication.pdf_url} publicationId={publication.id} />
            <ShareButton title={publication.title} />
          </div>
        </div>

        {publication.description && (
          <p className="lead mt-7 max-w-3xl">{publication.description}</p>
        )}
      </Section>

      {/* A leaderboard between the edition's details and the pages themselves.
          It is the last thing a reader passes before they start reading, which
          makes it the most valuable strip on the site. */}
      <Section width="wide" className="!py-8">
        <AdSlot placement="reader_top" edition={publication.edition} />
      </Section>

      {/* ── Reader ─────────────────────────────────────────────────────── */}
      {/* The rail sits on the left, as it does everywhere else on the site.
          On a phone it falls below the reader: someone who opened an edition
          came to read it, and the rail is long. */}
      <Section width="wide" className="!pt-0">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-6">
            {/* The reading tips come first so they are not buried under a rail
                of advertisements — they are what a reader needs in the first
                few seconds, and they are four lines long. */}
            <div className="card-quiet p-6">
              <h2 className="label-eyebrow text-[rgb(var(--text-faint))]">Reading this edition</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                <li>Swipe left or right to turn pages on a phone.</li>
                <li>Arrow keys turn pages; press F for full screen.</li>
                <li>Zoom in to read the fine print in a classified.</li>
                <li>Download the PDF to keep a copy offline.</li>
              </ul>
            </div>

            {/* Bookings made against the retired "reader_sidebar" placement are
                folded in by getBannersFor, so nothing stops rendering. */}
            <AdRail
              placements={["reader_rail", "reader_sidebar", "site_rail"]}
              edition={publication.edition}
              showTail={false}
            />

            <div className="card p-6">
              <h2 className="font-display text-xl tracking-[-0.02em]">
                Want your advertisement in here?
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                Tell us what you would like to advertise and we will lay it out for next
                week&apos;s edition.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
              >
                Get in touch
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
            <ReaderMount
              url={publication.pdf_url}
              title={publication.title}
              publicationId={publication.id}
            />
          </div>
        </div>

        <div className="mt-10">
          <AdSlot placement="reader_below" edition={publication.edition} />
        </div>
      </Section>

      {others.length > 0 && (
        <Section width="wide" className="!pt-4">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[rgb(var(--hairline))] pb-7">
            <h2 className="display-md">More editions</h2>
            <Link
              href="/archives"
              className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-[rgb(var(--hairline))] underline-offset-[6px] transition-colors hover:text-[rgb(var(--accent-text))]"
            >
              Browse the archive
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 lg:grid-cols-4">
            {others.map((p) => (
              <li key={p.id} className="h-full">
                <EditionCard publication={p} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
