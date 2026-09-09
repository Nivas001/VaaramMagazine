import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { getEdition } from "@/site.config";
import { formatDate, freshness } from "@/lib/utils";
import { CoverArt } from "@/components/magazine/MagazineCover";
import { cn } from "@/lib/utils";

/**
 * One edition in the archive grid.
 *
 * The whole card is a single link — a card with a nested "Read" button and a
 * linked title gives a keyboard user three stops for one destination. The
 * button here is styled, not interactive, and the hover state is driven from
 * the parent.
 */
export function EditionCard({
  publication,
  priority = false,
  className,
}: {
  publication: Publication;
  priority?: boolean;
  className?: string;
}) {
  const edition = getEdition(publication.edition);

  return (
    <article className={cn("group h-full", className)}>
      <Link
        href={`/archives/${publication.slug}`}
        className="flex h-full flex-col rounded-lg focus-visible:outline-offset-4"
      >
        {/* Cover, presented as a trimmed page rather than a rounded thumbnail. */}
        <div className="relative">
          <div
            className="page-stock aspect-[3/4] w-full transition-transform duration-500 ease-out group-hover:-translate-y-1.5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <CoverArt publication={publication} priority={priority} />
          </div>
          {/* The lift is sold by the shadow growing, not by the card scaling. */}
          <div
            aria-hidden
            className="absolute inset-x-4 bottom-0 -z-10 h-6 rounded-full bg-black/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-black/60"
          />
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <p className="label-eyebrow flex items-center gap-2.5 text-[rgb(var(--text-faint))]">
            {edition?.name ?? publication.edition}
            <span className="h-px w-3 bg-current/50" aria-hidden />
            {freshness(publication.edition_date)}
          </p>

          <h3 className="mt-3 font-display text-[26px] leading-tight tracking-[-0.025em] transition-colors group-hover:text-[rgb(var(--accent-text))]">
            {publication.title}
          </h3>

          <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">
            {formatDate(publication.edition_date)}
          </p>

          {publication.description && (
            <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
              {publication.description}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4 border-t border-[rgb(var(--hairline))] pt-4">
            <span className="text-[13px] font-medium text-[rgb(var(--text-faint))]">
              {publication.total_pages ? `${publication.total_pages} pages` : "PDF"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent-text))]">
              Read
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
