import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { getEdition } from "@/site.config";
import { formatBytes, formatDate } from "@/lib/utils";
import { CoverArt } from "@/components/magazine/MagazineCover";

/**
 * A dense view for scanning many editions at once. Everything a reader needs to
 * pick one out sits on a single line at desktop width, and reflows into two
 * readable lines on a phone rather than shrinking.
 */
export function ListView({ publications }: { publications: Publication[] }) {
  return (
    <ul className="border-t border-[rgb(var(--hairline))]">
      {publications.map((publication) => {
        const edition = getEdition(publication.edition);
        const size = formatBytes(publication.file_size_bytes);

        return (
          <li key={publication.id} className="border-b border-[rgb(var(--hairline))]">
            <Link
              href={`/archives/${publication.slug}`}
              className="group flex items-center gap-4 py-4 transition-colors hover:bg-[rgb(var(--surface-2))] sm:gap-6 sm:py-5"
            >
              {/* Thumbnail, kept small — the cover is a cue here, not the point. */}
              <div className="page-stock aspect-[3/4] w-[52px] shrink-0 sm:w-[60px]">
                <CoverArt publication={publication} />
              </div>

              <div className="grid min-w-0 flex-1 gap-x-6 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-xl leading-tight tracking-[-0.02em] transition-colors group-hover:text-[rgb(var(--accent-text))] sm:text-[22px]">
                    {publication.title}
                  </h3>
                  <p className="mt-1 truncate text-sm text-[rgb(var(--text-muted))]">
                    {formatDate(publication.edition_date)}
                    <span className="mx-2" aria-hidden>
                      ·
                    </span>
                    {edition?.name ?? publication.edition}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-5 text-[13px] text-[rgb(var(--text-faint))]">
                  {publication.total_pages && (
                    <span className="tabular-nums">{publication.total_pages} pages</span>
                  )}
                  {size && <span className="hidden tabular-nums sm:inline">{size}</span>}
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent-text))]">
                    Read
                    <ArrowUpRight
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
