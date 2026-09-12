"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Contrast,
  Download,
  Keyboard,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MousePointer2,
  Pause,
  Play,
  Printer,
  Search,
  Share2,
  Square,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PdfBook, type OutlineNode, type Rect, type SearchHit } from "@/lib/pdf-book";
import { cn } from "@/lib/utils";
import { Flipbook, SPREAD_MIN_WIDTH, type FlipbookHandle, type Tone } from "./Flipbook";
import { ReaderPanel, type PanelTab } from "./ReaderPanel";

/**
 * The edition reader.
 *
 * It is built as a magazine rather than as a document viewer, because that is
 * what Vaaram is: two pages facing each other, a sheet you can take hold of
 * and turn, and a spine between them. The flipping itself lives in
 * `Flipbook`; everything here is the room around it — the chrome, the
 * keyboard, the reader's own place in the edition, and the panel that answers
 * "where is the thing I want?".
 *
 * Three decisions are worth knowing about:
 *
 *  · **Two pages or one is decided by the reader's own width, not the
 *    window's.** The reader does not get the whole screen — it shares a row
 *    with the advertisement rail and gives up another column to the navigator —
 *    so a phone turned sideways gets the spread while a wide window with both
 *    of those open may not. Either way the reader can override it, and the
 *    override sticks.
 *
 *  · **Where you stopped is remembered, per edition, on your own device.**
 *    Nothing is sent anywhere and no account is involved — which matters for a
 *    free paper nobody signs in to.
 *
 *  · **Every control has a keyboard shortcut**, and pressing `?` lists them.
 *    An e-paper is read for half an hour at a time; reaching for the mouse to
 *    turn every page is the difference between reading it and giving up.
 */

type Prefs = {
  tone: Tone;
  sound: boolean;
  spread: boolean | null;
  fit: "page" | "width";
  selectable: boolean;
};

const DEFAULT_PREFS: Prefs = {
  tone: "paper",
  sound: false,
  spread: null,
  fit: "page",
  selectable: false,
};

const PREFS_KEY = "vaaram.reader.prefs";
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const AUTOPLAY_MS = 6000;
/** Width the navigator column takes out of the reader on a wide screen. */
const PANEL_WIDTH = 290;

export function PdfReader({
  url,
  title,
  storageKey,
  onPagesResolved,
  onDownload,
}: {
  url: string;
  title: string;
  /** Namespaces this edition's saved place and bookmarks. */
  storageKey?: string;
  onPagesResolved?: (pages: number) => void;
  onDownload?: () => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<FlipbookHandle>(null);

  const [book, setBook] = useState<PdfBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [outline, setOutline] = useState<OutlineNode[]>([]);

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [zoom, setZoom] = useState(1);
  const [wide, setWide] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [litLinks, setLitLinks] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("pages");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [activeHit, setActiveHit] = useState<number | null>(null);

  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [resumeTo, setResumeTo] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const placeKey = storageKey ? `vaaram.reader.place.${storageKey}` : null;

  /* ── Preferences, and the place this reader left off ──────────────────── */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* A browser refusing storage costs the preference, never the reading. */
    }
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((previous) => {
      const next = { ...previous, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!placeKey) return;
    try {
      const raw = localStorage.getItem(placeKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { page?: number; bookmarks?: number[] };
      if (Array.isArray(saved.bookmarks)) setBookmarks(saved.bookmarks);
      // A link with a page in it is the reader's intent right now, and always
      // beats where they happened to stop last time.
      const requested = pageFromLocation();
      if (requested) setPage(requested);
      else if (saved.page && saved.page > 1) setResumeTo(saved.page);
    } catch {
      /* ignore */
    }
  }, [placeKey]);

  /* ── Open the document ────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    let opened: PdfBook | null = null;

    void PdfBook.open(url)
      .then((instance) => {
        if (cancelled) {
          instance.destroy();
          return;
        }
        opened = instance;
        setBook(instance);
        onPagesResolved?.(instance.numPages);
        void instance.getOutline().then((nodes) => !cancelled && setOutline(nodes));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[reader]", err);
        setError(
          "We could not open this edition in the reader. You can still download the PDF below."
        );
      });

    return () => {
      cancelled = true;
      opened?.destroy();
    };
  }, [url, onPagesResolved]);

  const numPages = book?.numPages ?? 0;

  /* ── Remember the page, and keep it in the address bar ────────────────── */

  useEffect(() => {
    if (!book) return;
    const id = window.setTimeout(() => {
      if (placeKey) {
        try {
          localStorage.setItem(placeKey, JSON.stringify({ page, bookmarks }));
        } catch {
          /* ignore */
        }
      }
      // replaceState, not the router: a page turn is not a navigation, and
      // pushing one would bury the archive under sixty history entries.
      const target = new URL(window.location.href);
      if (page > 1) target.searchParams.set("page", String(page));
      else target.searchParams.delete("page");
      window.history.replaceState(null, "", target);
    }, 400);
    return () => window.clearTimeout(id);
  }, [page, bookmarks, placeKey, book]);

  /* ── One page or two ──────────────────────────────────────────────────── */

  /**
   * Measured off the reader itself, not the window.
   *
   * The reader does not get the whole screen — on an edition page it shares a
   * row with the advertisement rail, and opening the navigator takes another
   * 290px out of it. A window-width media query would happily promise a spread
   * inside a column only 600px wide, which is two unreadable ribbons of type.
   */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const measure = () => {
      const available = el.clientWidth - (panelOpen && el.clientWidth >= 1024 ? PANEL_WIDTH : 0);
      setWide(available >= SPREAD_MIN_WIDTH);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [panelOpen]);

  // The reader can ask for one page or two, but a column too narrow to carry a
  // spread overrules them — it is not a preference worth honouring into
  // illegibility.
  const spread = (prefs.spread ?? true) && wide;

  /* ── Zoom, fit and fullscreen ─────────────────────────────────────────── */

  const clampZoom = useCallback(
    (value: number) => Math.min(Math.max(value, ZOOM_MIN), ZOOM_MAX),
    []
  );

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* Blocked inside some in-app browsers; not worth telling the reader. */
    }
  }, []);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  /* ── Navigation ───────────────────────────────────────────────────────── */

  const goToPage = useCallback(
    (target: number) => {
      if (!book) return;
      setResumeTo(null);
      flipRef.current?.goToPage(Math.min(Math.max(target, 1), book.numPages));
    },
    [book]
  );

  const turn = useCallback(
    (direction: 1 | -1) => {
      setResumeTo(null);
      flipRef.current?.turn(direction);
    },
    []
  );

  /* ── Auto-flip ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!autoplay || !book) return;
    const id = window.setInterval(() => {
      if (page >= book.numPages) {
        setAutoplay(false);
        return;
      }
      flipRef.current?.turn(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, book, page]);

  /* ── Keyboard ─────────────────────────────────────────────────────────── */

  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      // Space and Enter belong to whatever control has focus. Stealing them
      // would turn a page every time someone activated a toolbar button.
      if (e.key === " " && target?.closest("button,a,[role='menuitem']")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          turn(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          turn(-1);
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(numPages);
          break;
        case "+":
        case "=":
          setZoom((z) => clampZoom(z * 1.25));
          break;
        case "-":
          setZoom((z) => clampZoom(z / 1.25));
          break;
        case "0":
          setZoom(1);
          break;
        case "/":
          e.preventDefault();
          setPanelOpen(true);
          setPanelTab("search");
          break;
        case "?":
          setHelpOpen((open) => !open);
          break;
        case "Escape":
          if (helpOpen) setHelpOpen(false);
          else if (menuOpen) setMenuOpen(false);
          break;
        default:
          switch (e.key.toLowerCase()) {
            case "f":
              void toggleFullscreen();
              break;
            case "t":
              setPanelOpen((open) => !open);
              setPanelTab("pages");
              break;
            case "d":
              updatePrefs({ spread: !spread });
              break;
            case "s":
              updatePrefs({ sound: !prefs.sound });
              break;
            case "n":
              updatePrefs({
                tone: prefs.tone === "paper" ? "sepia" : prefs.tone === "sepia" ? "night" : "paper",
              });
              break;
            case "l":
              setLitLinks((lit) => !lit);
              break;
          }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    turn,
    goToPage,
    numPages,
    clampZoom,
    toggleFullscreen,
    updatePrefs,
    spread,
    prefs.sound,
    prefs.tone,
    helpOpen,
    menuOpen,
  ]);

  /* ── Search highlights, keyed by page for the flipbook ────────────────── */

  const highlights = useMemo(() => {
    const map = new Map<number, Rect[]>();
    for (const hit of hits) map.set(hit.page, hit.rects);
    return map;
  }, [hits]);

  const activeRect = useMemo(() => {
    if (activeHit === null) return null;
    const hit = hits[activeHit];
    if (!hit || !hit.rects[0]) return null;
    return { page: hit.page, rect: hit.rects[0] };
  }, [activeHit, hits]);

  /* ── Share ────────────────────────────────────────────────────────────── */

  const [shared, setShared] = useState(false);
  const share = useCallback(async () => {
    const link = new URL(window.location.href);
    link.searchParams.set("page", String(page));
    const href = link.toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} — page ${page}`, url: href });
        return;
      }
      await navigator.clipboard.writeText(href);
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    } catch {
      /* A cancelled share sheet is not an error. */
    }
  }, [page, title]);

  /** Where the scrubber handle is while it is being dragged. */
  const [scrub, setScrub] = useState<number | null>(null);
  const commitScrub = useCallback(() => {
    setScrub((value) => {
      if (value !== null) goToPage(value);
      return null;
    });
  }, [goToPage]);

  const toggleBookmark = useCallback((target: number) => {
    setBookmarks((current) =>
      current.includes(target)
        ? current.filter((n) => n !== target)
        : [...current, target].sort((a, b) => a - b)
    );
  }, []);

  /* ── Failure ──────────────────────────────────────────────────────────── */

  if (error) {
    return (
      <div className="card grid min-h-[50vh] place-items-center p-10 text-center">
        <div className="max-w-sm">
          <h2 className="display-md">The reader could not open this edition</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">{error}</p>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDownload}
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <Download className="size-4" aria-hidden /> Download the PDF
          </a>
        </div>
      </div>
    );
  }

  const zoomed = zoom > 1.001;

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg border border-[rgb(var(--hairline))]",
        "bg-[rgb(var(--surface-3))] shadow-[var(--shadow-card)]",
        fullscreen && "h-screen rounded-none border-0"
      )}
    >
      {/* ── Top chrome ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-[rgb(var(--hairline))] px-2 py-2 sm:px-3">
        <Tool
          onClick={() => {
            setPanelOpen((open) => !open);
            setPanelTab("pages");
          }}
          active={panelOpen && panelTab === "pages"}
          label="Pages (T)"
        >
          <Columns2 className="size-4" />
        </Tool>
        <Tool
          onClick={() => {
            setPanelOpen(true);
            setPanelTab("search");
          }}
          active={panelOpen && panelTab === "search"}
          label="Search this edition (/)"
        >
          <Search className="size-4" />
        </Tool>

        <span className="mx-1 hidden h-5 w-px bg-[rgb(var(--hairline))] sm:block" aria-hidden />

        <div className="hidden items-center gap-1 sm:flex">
          <Tool onClick={() => turn(-1)} disabled={page <= 1} label="Previous page (←)">
            <ChevronLeft className="size-4" />
          </Tool>
          <PageBox page={page} numPages={numPages} onGo={goToPage} />
          <Tool
            onClick={() => turn(1)}
            disabled={numPages > 0 && page >= numPages}
            label="Next page (→)"
          >
            <ChevronRight className="size-4" />
          </Tool>
        </div>

        <p className="ml-1 text-[13px] tabular-nums text-[rgb(var(--text-muted))] sm:hidden">
          <span className="font-semibold text-[rgb(var(--text))]">{page}</span>
          <span className="mx-1" aria-hidden>
            /
          </span>
          {numPages || "—"}
        </p>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            <Tool
              onClick={() => setZoom((z) => clampZoom(z / 1.25))}
              disabled={zoom <= ZOOM_MIN}
              label="Zoom out (−)"
            >
              <ZoomOut className="size-4" />
            </Tool>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="w-12 rounded-full py-1 text-center text-[12.5px] font-semibold tabular-nums text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-2))]"
              title="Reset zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Tool
              onClick={() => setZoom((z) => clampZoom(z * 1.25))}
              disabled={zoom >= ZOOM_MAX}
              label="Zoom in (+)"
            >
              <ZoomIn className="size-4" />
            </Tool>
            <Tool
              onClick={() => updatePrefs({ fit: prefs.fit === "page" ? "width" : "page" })}
              active={prefs.fit === "width"}
              label={prefs.fit === "page" ? "Fit the width" : "Fit the whole page"}
            >
              {prefs.fit === "page" ? <Square className="size-4" /> : <BookOpen className="size-4" />}
            </Tool>
          </div>

          {wide && (
            <Tool
              onClick={() => updatePrefs({ spread: !spread })}
              active={spread}
              label={spread ? "One page at a time (D)" : "Two pages side by side (D)"}
            >
              <Columns2 className={cn("size-4", !spread && "rotate-90")} />
            </Tool>
          )}

          <Tool onClick={() => void toggleFullscreen()} label="Full screen (F)">
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Tool>

          <div className="relative">
            <Tool onClick={() => setMenuOpen((open) => !open)} active={menuOpen} label="More">
              <MoreHorizontal className="size-4" />
            </Tool>
            {menuOpen && (
              <Menu
                onClose={() => setMenuOpen(false)}
                items={[
                  {
                    label: prefs.selectable ? "Stop selecting text" : "Select and copy text",
                    Icon: MousePointer2,
                    onClick: () => updatePrefs({ selectable: !prefs.selectable }),
                    active: prefs.selectable,
                  },
                  {
                    label: litLinks ? "Hide the links" : "Show every link",
                    Icon: Link2,
                    onClick: () => setLitLinks((lit) => !lit),
                    active: litLinks,
                  },
                  {
                    label:
                      prefs.tone === "paper"
                        ? "Warm the page"
                        : prefs.tone === "sepia"
                          ? "Dim for night"
                          : "Back to white paper",
                    Icon: Contrast,
                    onClick: () =>
                      updatePrefs({
                        tone:
                          prefs.tone === "paper"
                            ? "sepia"
                            : prefs.tone === "sepia"
                              ? "night"
                              : "paper",
                      }),
                  },
                  {
                    label: autoplay ? "Stop turning by itself" : "Turn pages by itself",
                    Icon: autoplay ? Pause : Play,
                    onClick: () => setAutoplay((on) => !on),
                    active: autoplay,
                  },
                  {
                    label: prefs.sound ? "Silence the pages" : "Hear the pages turn",
                    Icon: prefs.sound ? Volume2 : VolumeX,
                    onClick: () => updatePrefs({ sound: !prefs.sound }),
                    active: prefs.sound,
                  },
                  { separator: true },
                  { label: "Share this page", Icon: Share2, onClick: share },
                  {
                    // The PDF is served from another origin, so we can open it
                    // for the browser to print but cannot drive the dialogue.
                    label: "Open the PDF to print",
                    Icon: Printer,
                    onClick: () => window.open(url, "_blank", "noopener"),
                  },
                  {
                    label: "Download the PDF",
                    Icon: Download,
                    href: url,
                    onClick: () => onDownload?.(),
                  },
                  { separator: true },
                  {
                    label: "Keyboard shortcuts",
                    Icon: Keyboard,
                    onClick: () => setHelpOpen(true),
                  },
                ]}
              />
            )}
          </div>

          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDownload}
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-[rgb(var(--accent))] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-wine-strong sm:px-4"
          >
            <Download className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Download</span>
          </a>
        </div>
      </div>

      {/* ── The book, with its navigator beside it ───────────────────────── */}
      <div
        className={cn(
          "relative grid min-h-0 flex-1",
          panelOpen ? "lg:grid-cols-[290px_minmax(0,1fr)]" : "grid-cols-1"
        )}
      >
        {book && panelOpen && (
          <>
            {/* On a phone the navigator covers the book rather than squeezing
                it into a column too narrow to read. */}
            <div
              className="absolute inset-0 z-30 bg-black/45 lg:hidden"
              onClick={() => setPanelOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 z-40 flex w-[min(84vw,320px)] lg:static lg:w-auto">
              <ReaderPanel
                book={book}
                open
                tab={panelTab}
                onTabChange={setPanelTab}
                onClose={() => setPanelOpen(false)}
                page={page}
                onGoToPage={(n) => {
                  goToPage(n);
                  if (window.innerWidth < 1024) setPanelOpen(false);
                }}
                outline={outline}
                bookmarks={bookmarks}
                onToggleBookmark={toggleBookmark}
                onHits={setHits}
                activeHit={activeHit}
                onActiveHit={setActiveHit}
              />
            </div>
          </>
        )}

        <div
          className="relative min-h-0"
          // A spread is fitted to whichever of width or height runs out first.
          // In a wide column that is always the height, so the height is what
          // decides how large the pages come out — hence the generous 74vh.
          // On a phone it is the other way round: one page is as wide as the
          // screen allows and no taller than its own proportions, so the same
          // 74vh would leave a band of empty room above and below it. `136vw`
          // is roughly one page tall, and takes over whenever it is the smaller
          // of the two.
          style={fullscreen ? undefined : { minHeight: "clamp(380px, min(74vh, 136vw), 860px)" }}
        >
          {!book ? (
            <div className="grid h-full min-h-[64vh] place-items-center bg-warm-900">
              <div className="flex flex-col items-center gap-4 text-warm-400">
                <Loader2 className="size-6 animate-spin text-wine-soft" aria-hidden />
                <p className="label-eyebrow">Opening {title}</p>
              </div>
            </div>
          ) : (
            <>
              <Flipbook
                ref={flipRef}
                book={book}
                page={page}
                onPageChange={setPage}
                spread={spread}
                fit={prefs.fit}
                zoom={zoom}
                onZoomChange={(z) => setZoom(clampZoom(z))}
                tone={prefs.tone}
                sound={prefs.sound}
                reducedMotion={reducedMotion}
                selectable={prefs.selectable}
                litLinks={litLinks}
                highlights={highlights}
                activeHighlight={activeRect}
              />

              {/* Arrows float over the book rather than sitting in the chrome:
                  at full screen the chrome is gone and these are all there is. */}
              {!zoomed && (
                <>
                  <Arrow side="left" onClick={() => turn(-1)} disabled={page <= 1} />
                  <Arrow side="right" onClick={() => turn(1)} disabled={page >= numPages} />
                </>
              )}

              {resumeTo && (
                <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
                  <div className="flex items-center gap-3 rounded-full bg-[rgb(var(--surface-3))] py-2 pl-5 pr-2 text-[13px] shadow-[var(--shadow-lift)]">
                    <span className="text-[rgb(var(--text-muted))]">
                      You stopped on page {resumeTo}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToPage(resumeTo)}
                      className="inline-flex h-8 items-center rounded-full bg-[rgb(var(--accent))] px-4 font-semibold text-white"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeTo(null)}
                      className="grid size-8 place-items-center rounded-full text-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
                      aria-label="Start from the beginning"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── The scrubber ─────────────────────────────────────────────────── */}
      {numPages > 1 && (
        <div className="flex items-center gap-3 border-t border-[rgb(var(--hairline))] px-3 py-2.5">
          <button
            type="button"
            onClick={() => turn(-1)}
            disabled={page <= 1}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] text-[13px] font-semibold disabled:opacity-30 sm:hidden"
          >
            <ChevronLeft className="size-4" aria-hidden /> Back
          </button>

          {/* Dragging the scrubber moves the handle live but only turns the
              book when it is released: page turns take three quarters of a
              second each, and firing one per pixel makes the drag feel stuck. */}
          <input
            type="range"
            min={1}
            max={numPages}
            value={scrub ?? page}
            onChange={(e) => setScrub(Number(e.target.value))}
            onPointerUp={commitScrub}
            onPointerCancel={commitScrub}
            onKeyUp={commitScrub}
            onBlur={commitScrub}
            aria-label="Jump to a page"
            className="hidden h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[rgb(var(--hairline))] accent-[rgb(var(--accent))] sm:block"
          />
          <span className="hidden shrink-0 text-[12px] tabular-nums text-[rgb(var(--text-faint))] sm:block">
            {scrub ?? page} of {numPages}
          </span>

          <button
            type="button"
            onClick={() => turn(1)}
            disabled={page >= numPages}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[rgb(var(--accent))] text-[13px] font-semibold text-white disabled:opacity-30 sm:hidden"
          >
            Next <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {shared && (
        <p className="pointer-events-none absolute inset-x-0 bottom-20 z-50 mx-auto w-fit rounded-full bg-[rgb(var(--text))] px-5 py-2.5 text-[13px] font-semibold text-[rgb(var(--surface))] shadow-[var(--shadow-lift)]">
          Link to page {page} copied
        </p>
      )}

      {/* Screen readers are told where the reader is, once the turn settles. */}
      <p className="sr-only" aria-live="polite">
        Page {page} of {numPages}
      </p>

      {helpOpen && <Shortcuts onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

/* ── Small pieces ───────────────────────────────────────────────────────── */

function Tool({
  children,
  onClick,
  label,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-colors",
        "disabled:pointer-events-none disabled:opacity-30",
        active
          ? "bg-[rgb(var(--accent))] text-white"
          : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]"
      )}
    >
      {children}
    </button>
  );
}

/** A page number you can type into, which is faster than sixty clicks. */
function PageBox({
  page,
  numPages,
  onGo,
}: {
  page: number;
  numPages: number;
  onGo: (page: number) => void;
}) {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);

  const commit = () => {
    const value = Number(draft);
    if (Number.isFinite(value) && value >= 1) onGo(Math.min(value, numPages));
    else setDraft(String(page));
  };

  return (
    <span className="flex items-center gap-1.5 text-[13px] text-[rgb(var(--text-muted))]">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        inputMode="numeric"
        aria-label="Page number"
        className="h-8 w-11 rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] text-center text-[13px] font-semibold tabular-nums text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--accent))]"
      />
      <span aria-hidden>/</span>
      <span className="tabular-nums">{numPages || "—"}</span>
    </span>
  );
}

function Arrow({
  side,
  onClick,
  disabled,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous page" : "Next page"}
      className={cn(
        "absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full",
        "bg-black/35 text-white backdrop-blur-sm transition-all hover:bg-black/60",
        "disabled:pointer-events-none disabled:opacity-0 sm:grid",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

type MenuItem =
  | { separator: true }
  | {
      separator?: false;
      label: string;
      Icon: React.ComponentType<{ className?: string }>;
      onClick?: () => void;
      href?: string;
      active?: boolean;
    };

function Menu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // A frame's delay, or the click that opened the menu closes it again.
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] py-1.5 shadow-[var(--shadow-lift)]"
    >
      {items.map((item, i) =>
        item.separator ? (
          <hr key={i} className="my-1.5 border-t border-[rgb(var(--hairline))]" />
        ) : (
          <MenuRow key={i} item={item} onClose={onClose} />
        )
      )}
    </div>
  );
}

function MenuRow({
  item,
  onClose,
}: {
  item: Extract<MenuItem, { separator?: false }>;
  onClose: () => void;
}) {
  const { label, Icon, onClick, href, active } = item;
  const className = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] transition-colors",
    active
      ? "text-[rgb(var(--accent-text))]"
      : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]",
    "hover:bg-[rgb(var(--surface-2))]"
  );

  if (href) {
    return (
      <a
        href={href}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => {
          onClick?.();
          onClose();
        }}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={className}
      onClick={() => {
        onClick?.();
        onClose();
      }}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

const SHORTCUTS: [string, string][] = [
  ["← / →", "Turn the page"],
  ["Space", "Turn forward"],
  ["Home / End", "First page · last page"],
  ["+ / −", "Zoom in · out"],
  ["0", "Back to fit"],
  ["Drag", "Peel the page, or pan when zoomed"],
  ["Double click", "Zoom to where you clicked"],
  ["T", "Pages panel"],
  ["/", "Search the edition"],
  ["D", "One page or two"],
  ["N", "Paper, warm or night"],
  ["L", "Show every link"],
  ["S", "Page-turn sound"],
  ["F", "Full screen"],
  ["?", "This list"],
];

function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-5"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-md rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6 shadow-[var(--shadow-lift)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="display-md">Reading shortcuts</h2>
        <dl className="mt-5 grid gap-y-2.5">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys} className="flex items-baseline gap-4">
              <dt className="w-32 shrink-0 text-[12px] font-semibold text-[rgb(var(--text))]">
                {keys}
              </dt>
              <dd className="text-[13px] text-[rgb(var(--text-muted))]">{what}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** A `?page=` in the link the reader followed. */
function pageFromLocation(): number | null {
  try {
    const value = new URL(window.location.href).searchParams.get("page");
    const page = Number(value);
    return Number.isFinite(page) && page >= 1 ? page : null;
  } catch {
    return null;
  }
}
