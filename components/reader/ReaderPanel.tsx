"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ListTree, LayoutGrid, Loader2, Search, X } from "lucide-react";
import type { OutlineNode, PdfBook, SearchHit } from "@/lib/pdf-book";
import { cn } from "@/lib/utils";

/**
 * The drawer beside the book: pages, search, contents and saved places.
 *
 * All four are ways of answering the same question — "where is the thing I
 * want?" — so they live in one panel with one set of tabs rather than four
 * separate buttons that each open something different.
 *
 * The panel is a sheet from the left on a phone and a column beside the book
 * on a desktop, which is the only layout difference between them.
 */

export type PanelTab = "pages" | "search" | "contents" | "saved";

export function ReaderPanel({
  book,
  open,
  tab,
  onTabChange,
  onClose,
  page,
  onGoToPage,
  outline,
  bookmarks,
  onToggleBookmark,
  onHits,
  activeHit,
  onActiveHit,
}: {
  book: PdfBook;
  open: boolean;
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  page: number;
  onGoToPage: (page: number) => void;
  outline: OutlineNode[];
  bookmarks: number[];
  onToggleBookmark: (page: number) => void;
  onHits: (hits: SearchHit[]) => void;
  activeHit: number | null;
  onActiveHit: (index: number | null) => void;
}) {
  const tabs: { id: PanelTab; label: string; Icon: typeof LayoutGrid; hidden?: boolean }[] = [
    { id: "pages", label: "Pages", Icon: LayoutGrid },
    { id: "search", label: "Search", Icon: Search },
    { id: "contents", label: "Contents", Icon: ListTree, hidden: outline.length === 0 },
    { id: "saved", label: "Saved", Icon: Bookmark },
  ];

  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]",
        "lg:border-r",
        !open && "hidden"
      )}
      role="region"
      aria-label="Edition navigator"
    >
      {/* Four tabs plus a close button do not fit across a phone-width drawer,
          so the row scrolls sideways rather than spilling out of it. */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-[rgb(var(--hairline))] px-2 py-2">
        {tabs
          .filter((t) => !t.hidden)
          .map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-pressed={tab === id}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors",
                tab === id
                  ? "bg-[rgb(var(--accent))] text-white"
                  : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-3))]"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-3))]"
          aria-label="Close the navigator"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "pages" && <Pages book={book} page={page} onGoToPage={onGoToPage} />}
        {tab === "search" && (
          <SearchTab
            book={book}
            onGoToPage={onGoToPage}
            onHits={onHits}
            activeHit={activeHit}
            onActiveHit={onActiveHit}
          />
        )}
        {tab === "contents" && <Contents nodes={outline} onGoToPage={onGoToPage} />}
        {tab === "saved" && (
          <Saved
            book={book}
            bookmarks={bookmarks}
            page={page}
            onGoToPage={onGoToPage}
            onToggleBookmark={onToggleBookmark}
          />
        )}
      </div>
    </div>
  );
}

/* ── Pages ──────────────────────────────────────────────────────────────── */

function Pages({
  book,
  page,
  onGoToPage,
}: {
  book: PdfBook;
  page: number;
  onGoToPage: (page: number) => void;
}) {
  const numbers = useMemo(
    () => Array.from({ length: book.numPages }, (_, i) => i + 1),
    [book.numPages]
  );

  // Keep the page the reader is on in view as they turn, but never fight a
  // scroll they are in the middle of.
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-thumb="${page}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [page]);

  return (
    <ul ref={listRef} className="grid grid-cols-3 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
      {numbers.map((n) => (
        <li key={n} data-thumb={n}>
          <Thumbnail book={book} pageNumber={n} current={n === page} onClick={() => onGoToPage(n)} />
        </li>
      ))}
    </ul>
  );
}

/**
 * A page thumbnail that only rasterises once it is actually scrolled into
 * view. A sixty-page edition would otherwise spend a minute of CPU drawing
 * pictures nobody scrolled to.
 */
function Thumbnail({
  book,
  pageNumber,
  current,
  onClick,
}: {
  book: PdfBook;
  pageNumber: number;
  current: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || src) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void book.getThumbnail(pageNumber).then((image) => image && setSrc(image.url));
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [book, pageNumber, src]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn("pdf-thumb aspect-[3/4]", current && "pdf-thumb-current")}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={current ? "true" : undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <span className="block size-full bg-[rgb(var(--surface-3))]" />
      )}
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[11px] font-semibold tabular-nums text-white"
        )}
      >
        {pageNumber}
      </span>
    </button>
  );
}

/* ── Search ─────────────────────────────────────────────────────────────── */

function SearchTab({
  book,
  onGoToPage,
  onHits,
  activeHit,
  onActiveHit,
}: {
  book: PdfBook;
  onGoToPage: (page: number) => void;
  onHits: (hits: SearchHit[]) => void;
  activeHit: number | null;
  onActiveHit: (index: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      onHits([]);
      onActiveHit(null);
      return;
    }

    const controller = new AbortController();
    const found: SearchHit[] = [];
    setHits([]);
    setRunning(true);

    // A short pause before searching: typing "Scarborough" should scan the
    // edition once, not eleven times.
    const id = window.setTimeout(() => {
      void book
        .search(term, {
          signal: controller.signal,
          onHit: (hit) => {
            found.push(hit);
            setHits([...found]);
            onHits([...found]);
          },
        })
        .finally(() => !controller.signal.aborted && setRunning(false));
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, book]);

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[rgb(var(--text-faint))]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this edition"
          aria-label="Search this edition"
          className="h-10 w-full rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] pl-9 pr-9 text-sm outline-none focus:border-[rgb(var(--accent))]"
        />
        {running && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[rgb(var(--text-faint))]"
            aria-hidden
          />
        )}
      </div>

      <p className="mt-3 px-1 text-[12px] text-[rgb(var(--text-faint))]" aria-live="polite">
        {query.trim().length < 2
          ? "Find a business, a street or a phone number."
          : hits.length === 0
            ? running
              ? "Searching…"
              : "Nothing found in this edition."
            : `${hits.length} page${hits.length === 1 ? "" : "s"} match`}
      </p>

      <ul className="mt-2 space-y-1.5">
        {hits.map((hit, i) => (
          <li key={hit.page}>
            <button
              type="button"
              onClick={() => {
                onActiveHit(i);
                onGoToPage(hit.page);
              }}
              className={cn(
                "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                activeHit === i
                  ? "bg-[rgb(var(--accent))]/12 ring-1 ring-[rgb(var(--accent))]/40"
                  : "hover:bg-[rgb(var(--surface-3))]"
              )}
            >
              <span className="label-eyebrow text-[rgb(var(--label))]">Page {hit.page}</span>
              <span className="mt-1.5 block break-words text-[12.5px] leading-relaxed text-[rgb(var(--text-muted))]">
                {hit.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Contents ───────────────────────────────────────────────────────────── */

function Contents({
  nodes,
  onGoToPage,
  depth = 0,
}: {
  nodes: OutlineNode[];
  onGoToPage: (page: number) => void;
  depth?: number;
}) {
  return (
    <ul className={cn(depth > 0 && "ml-3 border-l border-[rgb(var(--hairline))] pl-2")}>
      {nodes.map((node, i) => (
        <li key={`${node.title}-${i}`}>
          <button
            type="button"
            disabled={node.page === null}
            onClick={() => node.page && onGoToPage(node.page)}
            className="flex w-full items-baseline gap-3 rounded-md px-2.5 py-2 text-left text-[13px] text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--text))] disabled:opacity-50"
          >
            <span className="min-w-0 flex-1 truncate">{node.title}</span>
            {node.page && <span className="tabular-nums text-[rgb(var(--text-faint))]">{node.page}</span>}
          </button>
          {node.children.length > 0 && (
            <Contents nodes={node.children} onGoToPage={onGoToPage} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

/* ── Saved ──────────────────────────────────────────────────────────────── */

function Saved({
  book,
  bookmarks,
  page,
  onGoToPage,
  onToggleBookmark,
}: {
  book: PdfBook;
  bookmarks: number[];
  page: number;
  onGoToPage: (page: number) => void;
  onToggleBookmark: (page: number) => void;
}) {
  const saved = bookmarks.includes(page);
  const toggle = useCallback(() => onToggleBookmark(page), [onToggleBookmark, page]);

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition-colors",
          saved
            ? "border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-3))]"
            : "bg-[rgb(var(--accent))] text-white hover:bg-wine-strong"
        )}
      >
        <Bookmark className={cn("size-4", saved && "fill-current")} aria-hidden />
        {saved ? `Remove page ${page}` : `Save page ${page}`}
      </button>

      {bookmarks.length === 0 ? (
        <p className="mt-5 px-1 text-[12.5px] leading-relaxed text-[rgb(var(--text-faint))]">
          Save a page to come back to it. Your saved pages and the page you stopped on
          stay on this device — nothing is sent anywhere.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2.5 lg:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((n) => (
            <li key={n}>
              <Thumbnail book={book} pageNumber={n} current={n === page} onClick={() => onGoToPage(n)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
