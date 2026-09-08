"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Publication } from "@/lib/types";
import { formatDate, toDate } from "@/lib/utils";
import { CoverArt } from "@/components/magazine/MagazineCover";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** A month is addressed as a single number so comparisons stay trivial. */
const monthKey = (year: number, month: number) => year * 12 + month;

/**
 * The archive as a calendar — the view that answers "which weeks did you
 * publish?" at a glance.
 *
 * Days that carry an edition show that edition's cover rather than a dot, which
 * is what keeps this reading as a publication archive instead of a booking
 * screen. All date arithmetic is done in UTC, because an edition dated
 * 2026-09-06 is that date everywhere, not a moment in time.
 */
export function CalendarView({ publications }: { publications: Publication[] }) {
  const reduce = useReducedMotion();

  /** "YYYY-MM-DD" → the edition published that day. */
  const byDate = useMemo(() => {
    const map = new Map<string, Publication>();
    for (const p of publications) map.set(p.edition_date.slice(0, 10), p);
    return map;
  }, [publications]);

  /** The span of months worth paging through — never beyond real editions. */
  const { first, last, newest } = useMemo(() => {
    const sorted = [...publications].sort((a, b) =>
      a.edition_date.localeCompare(b.edition_date)
    );
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];
    return {
      first: earliest ? toDate(earliest.edition_date) : new Date(),
      last: latest ? toDate(latest.edition_date) : new Date(),
      newest: latest ?? null,
    };
  }, [publications]);

  const [cursor, setCursor] = useState(() => ({
    year: last.getUTCFullYear(),
    month: last.getUTCMonth(),
  }));
  const [selected, setSelected] = useState<Publication | null>(newest);

  const minKey = monthKey(first.getUTCFullYear(), first.getUTCMonth());
  const maxKey = monthKey(last.getUTCFullYear(), last.getUTCMonth());
  const currentKey = monthKey(cursor.year, cursor.month);

  function step(delta: number) {
    const next = new Date(Date.UTC(cursor.year, cursor.month + delta, 1));
    setCursor({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  }

  /** The cells of the visible month, padded to whole weeks. */
  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const leading = firstOfMonth.getUTCDay();

    const out: { key: string; date: Date | null }[] = [];
    for (let i = 0; i < leading; i++) out.push({ key: `pad-${i}`, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(cursor.year, cursor.month, d));
      out.push({ key: date.toISOString().slice(0, 10), date });
    }
    // Pad to a whole number of rows so the grid never has a ragged last week.
    while (out.length % 7 !== 0) out.push({ key: `pad-end-${out.length}`, date: null });
    return out;
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(cursor.year, cursor.month, 1)));

  const publishedThisMonth = cells.filter(
    (c) => c.date && byDate.has(c.key)
  ).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      {/* ── The calendar ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-4 border-b border-[rgb(var(--hairline))] pb-5">
          <div>
            <h3 className="display-md">{monthLabel}</h3>
            <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">
              {publishedThisMonth === 0
                ? "No editions this month"
                : `${publishedThisMonth} edition${publishedThisMonth === 1 ? "" : "s"} published`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={currentKey <= minKey}
              aria-label="Previous month"
              className="grid size-10 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--text-faint))] hover:text-[rgb(var(--text))] disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-[18px]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={currentKey >= maxKey}
              aria-label="Next month"
              className="grid size-10 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--text-faint))] hover:text-[rgb(var(--text))] disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-[18px]" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]"
            >
              {/* The full name is announced; only the initial fits on a phone. */}
              <span aria-hidden className="sm:hidden">
                {day[0]}
              </span>
              <span className="hidden sm:inline">{day}</span>
              <span className="sr-only">{day}</span>
            </div>
          ))}

          {cells.map(({ key, date }) => {
            if (!date) return <div key={key} aria-hidden />;

            const publication = byDate.get(key);
            const isSelected = publication && selected?.id === publication.id;
            const dayNumber = date.getUTCDate();

            if (!publication) {
              return (
                <div
                  key={key}
                  className="grid aspect-[3/4] place-items-center rounded-[5px] border border-dashed border-[rgb(var(--hairline))] text-[13px] text-[rgb(var(--text-faint))]/55"
                >
                  {dayNumber}
                </div>
              );
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(publication)}
                aria-pressed={isSelected}
                aria-label={`${publication.title}, published ${formatDate(publication.edition_date)}`}
                className={cn(
                  "group relative aspect-[3/4] overflow-hidden rounded-[5px] outline-none transition-all duration-300",
                  "ring-offset-2 ring-offset-[rgb(var(--surface))]",
                  isSelected
                    ? "ring-2 ring-[rgb(var(--accent))]"
                    : "ring-1 ring-[rgb(var(--hairline))] hover:ring-[rgb(var(--text-faint))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent))]"
                )}
              >
                <CoverArt publication={publication} className="transition-transform duration-500 group-hover:scale-[1.06]" />

                {/* The date stays legible over any cover artwork. */}
                <span
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pt-4 pb-1 text-center text-[11px] font-bold text-white tabular-nums sm:text-xs"
                  aria-hidden
                >
                  {dayNumber}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[rgb(var(--text-faint))]">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-[3px] bg-[rgb(var(--text-faint))]/40" aria-hidden />
            Edition published
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="size-3 rounded-[3px] border border-dashed border-[rgb(var(--hairline))]"
              aria-hidden
            />
            No edition
          </span>
        </p>
      </div>

      {/* ── The selected edition ───────────────────────────────────────── */}
      <div className="lg:sticky lg:top-40 lg:self-start">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
              className="card overflow-hidden p-6"
            >
              <p className="label-eyebrow text-[rgb(var(--label))]">Selected edition</p>

              <Link
                href={`/archives/${selected.slug}`}
                className="group mt-5 block"
                aria-label={`Read ${selected.title}`}
              >
                <div className="page-stock mx-auto aspect-[3/4] w-40 transition-transform duration-500 group-hover:-translate-y-1">
                  <CoverArt publication={selected} />
                </div>

                <h4 className="mt-6 font-display text-2xl tracking-[-0.025em] transition-colors group-hover:text-[rgb(var(--accent))]">
                  {selected.title}
                </h4>
              </Link>

              <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
                {formatDate(selected.edition_date)}
                {selected.total_pages && (
                  <>
                    <span className="mx-2" aria-hidden>
                      ·
                    </span>
                    {selected.total_pages} pages
                  </>
                )}
              </p>

              {selected.description && (
                <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {selected.description}
                </p>
              )}

              <Link
                href={`/archives/${selected.slug}`}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
              >
                Read this edition
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </motion.div>
          ) : (
            <div className="card-quiet p-6 text-sm text-[rgb(var(--text-muted))]">
              Pick a marked date to see that edition.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
