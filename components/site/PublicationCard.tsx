import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { DownloadButton } from "@/components/site/DownloadButton";
import type { Publication } from "@/lib/types";
import { getEdition } from "@/site.config";
import { editionLabel, formatBytes } from "@/lib/utils";
import { BentoCard } from "@/components/ui/Bento";
import { cn } from "@/lib/utils";

export function PublicationCard({
  publication,
  featured = false,
}: {
  publication: Publication;
  featured?: boolean;
}) {
  const edition = getEdition(publication.edition);

  return (
    <BentoCard
      as="article"
      className={cn(
        "flex flex-col border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:border-[#cd2129] shadow-sm hover:shadow-md transition-all",
        featured ? "p-6 sm:p-8" : "p-5 sm:p-6"
      )}
    >
      <Link
        href={`/editions/${publication.slug}`}
        className="relative block overflow-hidden border border-neutral-200 dark:border-neutral-800"
        aria-label={`Read ${publication.title}`}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-900",
            featured ? "aspect-[3/4]" : "aspect-[4/5]"
          )}
        >
          {publication.cover_url ? (
            <img
              src={publication.cover_url}
              alt={`Front page of ${publication.title}`}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-neutral-500">
              <FileText className="size-9 stroke-[1.5] text-neutral-400 dark:text-neutral-500" />
              <span className="font-display text-lg tracking-wider text-neutral-900 dark:text-white uppercase">
                {edition?.name ?? publication.edition}
              </span>
              <span className="font-sans text-xs uppercase font-bold tracking-wider text-[#b89028] dark:text-[#d2ac47]">
                {editionLabel(publication.edition_date)}
              </span>
            </div>
          )}
          <span className="absolute right-0 top-0 bg-[#cd2129] px-2.5 py-0.5 font-display text-[11px] font-normal uppercase tracking-wider text-white">
            PDF
          </span>
        </div>
      </Link>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 font-display text-xs tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase">
          <span>{edition?.name ?? publication.edition}</span>
          <span aria-hidden>·</span>
          <span>{editionLabel(publication.edition_date)}</span>
        </div>

        <h3
          className={cn(
            "mt-2.5 font-display uppercase tracking-wide text-neutral-900 dark:text-white transition-colors hover:text-[#cd2129]",
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          )}
        >
          <Link href={`/editions/${publication.slug}`}>
            {publication.title}
          </Link>
        </h3>

        {publication.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {publication.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-wider text-neutral-500">
          {publication.total_pages ? <span>{publication.total_pages} PAGES</span> : null}
          {publication.file_size_bytes ? (
            <>
              <span aria-hidden>·</span>
              <span>{formatBytes(publication.file_size_bytes)}</span>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            href={`/editions/${publication.slug}`}
            className="inline-flex h-10 items-center gap-1.5 bg-[#cd2129] px-5 font-bold text-xs uppercase tracking-wider text-white hover:bg-[#b01b22] transition-colors"
          >
            READ ONLINE <ArrowUpRight className="size-3.5" />
          </Link>
          <DownloadButton
            url={publication.pdf_url}
            publicationId={publication.id}
            label="PDF"
            className="h-10 border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-4 font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white hover:border-[#cd2129] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          />
        </div>
      </div>
    </BentoCard>
  );
}
