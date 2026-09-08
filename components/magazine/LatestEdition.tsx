import Link from "next/link";
import { ArrowRight, BookOpen, Download } from "lucide-react";
import type { Publication } from "@/lib/types";
import { getEdition } from "@/site.config";
import { editionLabel, formatBytes, formatDate, freshness } from "@/lib/utils";
import { MagazineCover } from "@/components/magazine/MagazineCover";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/**
 * The full record of one edition: cover, title, edition, date, description and
 * page count, with the two actions that matter — read it, or go find another.
 *
 * Used on the home page beneath the hero and again at the foot of the archive,
 * which is why it takes its publication as a prop and owns no data of its own.
 */
export function LatestEdition({
  publication,
  heading = "This week's edition",
  className,
}: {
  publication: Publication;
  heading?: string;
  className?: string;
}) {
  const edition = getEdition(publication.edition);
  const size = formatBytes(publication.file_size_bytes);

  return (
    <section
      aria-labelledby="latest-edition-heading"
      className={cn("relative", className)}
    >
      <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20">
        <Reveal className="flex justify-center lg:justify-start">
          <Link
            href={`/archives/${publication.slug}`}
            aria-label={`Read ${publication.title}`}
            className="block rounded-sm transition-transform duration-500 hover:-translate-y-1"
          >
            <MagazineCover publication={publication} size="md" />
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <Eyebrow>{heading}</Eyebrow>

          <h2 id="latest-edition-heading" className="display-lg mt-5">
            {publication.title}
          </h2>

          <p className="mt-3 text-[15px] font-medium text-[rgb(var(--text-faint))]">
            {edition?.name ?? publication.edition} edition
            <span className="mx-2.5" aria-hidden>
              ·
            </span>
            {editionLabel(publication.edition_date)}
          </p>

          {publication.description && (
            <p className="lead mt-6 max-w-xl">{publication.description}</p>
          )}

          {/* The specifics a reader wants before committing to a download. */}
          <dl className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-[rgb(var(--hairline))] py-5">
            <Fact label="Published" value={formatDate(publication.edition_date)} />
            {publication.total_pages && (
              <Fact label="Length" value={`${publication.total_pages} pages`} />
            )}
            {size && <Fact label="File" value={`PDF · ${size}`} />}
            <Fact label="Status" value={freshness(publication.edition_date)} accent />
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/archives/${publication.slug}`}
              className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-[rgb(var(--accent))] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-ember-strong"
            >
              <BookOpen className="size-[18px]" aria-hidden />
              Read now
            </Link>

            <Link
              href="/archives"
              className="inline-flex h-[52px] items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-7 text-[15px] font-semibold text-[rgb(var(--text))] transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
            >
              View archives
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <a
              href={publication.pdf_url}
              download
              className="inline-flex h-[52px] items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
            >
              <Download className="size-[17px]" aria-hidden />
              Download
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="label-eyebrow text-[rgb(var(--text-faint))]">{label}</dt>
      <dd
        className={cn(
          "mt-2 text-[15px] font-semibold",
          accent ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--text))]"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
