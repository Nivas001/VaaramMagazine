"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, LayoutGrid, List as ListIcon, Search, X } from "lucide-react";
import type { Publication } from "@/lib/types";
import { editionYear, formatDate } from "@/lib/utils";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { CalendarView } from "./CalendarView";
import { cn } from "@/lib/utils";

type View = "grid" | "list" | "calendar";

const VIEWS: { id: View; label: string; Icon: typeof LayoutGrid }[] = [
  { id: "grid", label: "Grid", Icon: LayoutGrid },
  { id: "list", label: "List", Icon: ListIcon },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
];

/**
 * The archive.
 *
 * Every edition is sent to the client once and all three views read from that
 * same array — a weekly publication adds 52 small rows a year, so filtering in
 * the browser stays instant for decades and costs no round trips.
 */
export function ArchiveBrowser({
  publications,
  inlineAd,
}: {
  publications: Publication[];
  /** Rendered on the server and passed in, so no server code reaches the client. */
  inlineAd?: ReactNode;
}) {
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | "all">("all");

  // Keeps typing responsive when the list is long: the input updates on every
  // keystroke while the results catch up.
  const deferredQuery = useDeferredValue(query);

  const years = useMemo(
    () =>
      Array.from(new Set(publications.map((p) => editionYear(p.edition_date)))).sort(
        (a, b) => b - a
      ),
    [publications]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return publications.filter((p) => {
      if (year !== "all" && editionYear(p.edition_date) !== year) return false;
      if (!q) return true;

      // Search covers everything a reader might remember about an edition,
      // including the date as they would see it written on the page.
      const haystack = [
        p.title,
        p.description ?? "",
        p.edition,
        p.edition_date,
        formatDate(p.edition_date),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [publications, deferredQuery, year]);

  const isFiltered = query.trim() !== "" || year !== "all";

  return (
    <div>
      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-[rgb(var(--hairline))] chrome-blur px-5 py-4 sm:top-[72px] sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">Search editions</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--text-faint))]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search editions"
              className={cn(
                "h-10 w-full rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))]",
                "pl-10 pr-9 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))]",
                "outline-none transition-colors focus:border-[rgb(var(--accent))]",
                // Safari draws its own clear button on top of ours.
                "[&::-webkit-search-cancel-button]:appearance-none"
              )}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-[rgb(var(--text-faint))] hover:text-[rgb(var(--text))]"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </label>

          {years.length > 1 && (
            <label className="shrink-0">
              <span className="sr-only">Filter by year</span>
              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="h-10 cursor-pointer rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] px-4 text-sm font-medium text-[rgb(var(--text))] outline-none transition-colors focus:border-[rgb(var(--accent))]"
              >
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div
            role="tablist"
            aria-label="Archive view"
            className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-1"
          >
            {VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={view === id}
                aria-label={`${label} view`}
                onClick={() => setView(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
                  view === id
                    ? "bg-[rgb(var(--text))] text-[rgb(var(--surface))]"
                    : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <p
          className="mt-3 text-[13px] text-[rgb(var(--text-faint))]"
          role="status"
          aria-live="polite"
        >
          {filtered.length === publications.length
            ? `${publications.length} editions`
            : `${filtered.length} of ${publications.length} editions`}
        </p>
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {/* Names the results region and keeps the heading order unbroken —
          the edition titles below are h3s under the page's h1. */}
      <h2 className="sr-only">Editions</h2>

      {filtered.length === 0 ? (
        <EmptyState
          onReset={() => {
            setQuery("");
            setYear("all");
          }}
          isFiltered={isFiltered}
        />
      ) : view === "grid" ? (
        <GridView publications={filtered} inlineAd={inlineAd} />
      ) : view === "list" ? (
        <ListView publications={filtered} />
      ) : (
        <CalendarView publications={filtered} />
      )}
    </div>
  );
}

function EmptyState({
  onReset,
  isFiltered,
}: {
  onReset: () => void;
  isFiltered: boolean;
}) {
  return (
    <div className="card mx-auto max-w-md px-8 py-14 text-center">
      <h2 className="display-md">
        {isFiltered ? "No editions match" : "No editions yet"}
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
        {isFiltered
          ? "Try a different search term, or clear the filters to see every edition."
          : "The first edition will appear here as soon as it is published."}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="mt-7 inline-flex h-11 items-center rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
