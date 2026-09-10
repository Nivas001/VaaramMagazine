"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<any>;
};

type LoadingTask = { promise: Promise<unknown>; destroy: () => Promise<void> };

const MAX_DPR = 2;

/**
 * A self-contained PDF reader built directly on pdf.js.
 *
 * Design notes:
 *  · Pages are rasterised to <canvas> rather than embedded with <iframe>, which
 *    is the only way to get a consistent, good-looking result on mobile Safari
 *    and Android Chrome.
 *  · The worker is served from our own /public folder, so the reader keeps
 *    working even if a CDN is blocked, and the worker version can never drift
 *    out of sync with the library.
 *  · Only the visible page (plus a prefetch of the next one) is ever rendered,
 *    so a 60-page paper opens as fast as a 4-page one.
 */
export function PdfReader({
  url,
  title,
  onPagesResolved,
  onDownload,
}: {
  url: string;
  title: string;
  onPagesResolved?: (pages: number) => void;
  onDownload?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<PdfDoc | null>(null);
  const loadingTaskRef = useRef<LoadingTask | null>(null);
  const renderTaskRef = useRef<any>(null);
  const touchStartX = useRef<number | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [turnKey, setTurnKey] = useState(0);

  /* ── Load the document once ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url,
          // Keeps memory sane on long papers read on cheap phones.
          disableAutoFetch: true,
          disableStream: false,
        }) as unknown as LoadingTask;
        loadingTaskRef.current = loadingTask;

        const doc = (await loadingTask.promise) as PdfDoc;

        if (cancelled) {
          void loadingTask.destroy();
          return;
        }

        docRef.current = doc;
        setNumPages(doc.numPages);
        onPagesResolved?.(doc.numPages);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[reader]", err);
        setError(
          "We could not open this PDF in the reader. You can still download it with the button below."
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      void loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      docRef.current = null;
    };
  }, [url, onPagesResolved]);

  /* ── Render the current page ────────────────────────────────────────── */
  const renderPage = useCallback(
    async (pageNumber: number) => {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      if (!doc || !canvas) return;

      renderTaskRef.current?.cancel?.();
      setRendering(true);

      try {
        const pdfPage = await doc.getPage(pageNumber);

        // Fit the page to the scrolling container, then apply the user's zoom.
        // Measuring the container (not the canvas's own parent, which shrinks to
        // fit the canvas) avoids a circular width dependency.
        const viewportEl = viewportRef.current;
        let containerWidth = 800;
        if (viewportEl) {
          const style = window.getComputedStyle(viewportEl);
          const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          containerWidth = Math.max(viewportEl.clientWidth - padding, 240);
        }
        const baseViewport = pdfPage.getViewport({ scale: 1, rotation });

        // Default view shows the whole page: fit to whichever of width or
        // height runs out first. Using the window height (not the container's,
        // which grows with the canvas) keeps this from feeding back on itself.
        // On a phone the width always wins, which is what you want for reading
        // small classified text.
        const heightBudget = window.innerHeight * 0.78;
        const fitScale = Math.min(
          containerWidth / baseViewport.width,
          heightBudget / baseViewport.height
        );
        const viewport = pdfPage.getViewport({ scale: fitScale * zoom, rotation });

        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const task = pdfPage.render({ canvas, canvasContext: context, viewport });
        renderTaskRef.current = task;
        await task.promise;

        // Warm the next page so forward paging feels instant.
        if (pageNumber < doc.numPages) void doc.getPage(pageNumber + 1);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error("[reader] render", err);
      } finally {
        setRendering(false);
      }
    },
    [zoom, rotation]
  );

  useEffect(() => {
    if (!loading && numPages > 0) void renderPage(page);
  }, [page, loading, numPages, renderPage]);

  /* ── Re-render on resize so the page always fits ────────────────────── */
  useEffect(() => {
    if (loading) return;
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => void renderPage(page));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, [loading, page, renderPage]);

  /* ── Navigation ─────────────────────────────────────────────────────── */
  const goTo = useCallback(
    (next: number) => {
      setPage((current) => {
        const target = Math.min(Math.max(next, 1), Math.max(numPages, 1));
        if (target !== current) setTurnKey((k) => k + 1);
        return target;
      });
    },
    [numPages]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(page + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(page - 1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.2, 3));
      else if (e.key === "-") setZoom((z) => Math.max(z - 0.2, 0.6));
      else if (e.key.toLowerCase() === "f") void toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  async function toggleFullscreen() {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      /* Fullscreen is blocked in some in-app browsers — not worth surfacing. */
    }
  }

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ── Swipe on touch devices ─────────────────────────────────────────── */
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) goTo(delta < 0 ? page + 1 : page - 1);
    touchStartX.current = null;
  }

  const iconButton =
    "grid size-9 place-items-center rounded-full text-[rgb(var(--text-muted))] transition-colors " +
    "hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))] " +
    "disabled:pointer-events-none disabled:opacity-30 cursor-pointer";

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
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <Download className="size-4" aria-hidden /> Download the PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-[rgb(var(--hairline))]",
        "bg-[rgb(var(--surface-3))] shadow-[var(--shadow-card)]",
        fullscreen && "rounded-none border-0"
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] px-2.5 py-2 sm:px-3">
        <div className="flex items-center gap-1">
          <button onClick={() => goTo(page - 1)} disabled={page <= 1} className={iconButton} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </button>

          <p className="px-2 text-[13px] tabular-nums text-[rgb(var(--text-muted))]">
            <span className="font-semibold text-[rgb(var(--text))]">{page}</span>
            <span className="mx-1.5" aria-hidden>/</span>
            {numPages || "—"}
          </p>

          <button
            onClick={() => goTo(page + 1)}
            disabled={numPages > 0 && page >= numPages}
            className={iconButton}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))} disabled={zoom <= 0.6} className={iconButton} aria-label="Zoom out">
            <ZoomOut className="size-4" />
          </button>
          <span className="w-12 text-center text-[13px] tabular-nums text-[rgb(var(--text-muted))]">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} disabled={zoom >= 3} className={iconButton} aria-label="Zoom in">
            <ZoomIn className="size-4" />
          </button>
          <button onClick={() => setRotation((r) => (r + 90) % 360)} className={iconButton} aria-label="Rotate page">
            <RotateCw className="size-4" />
          </button>
          <button onClick={toggleFullscreen} className={iconButton} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={onDownload}
            className="ml-1.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-[rgb(var(--accent))] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <Download className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Download</span>
            <span className="sr-only sm:hidden">Download</span>
          </a>
        </div>
      </div>

      {/* Page canvas */}
      <div
        ref={viewportRef}
        className={cn(
          "relative flex justify-center overflow-auto bg-warm-900 p-3 sm:p-6",
          fullscreen ? "flex-1" : "min-h-[62vh]"
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-warm-400">
            <Loader2 className="size-6 animate-spin text-wine-soft" aria-hidden />
            <p className="label-eyebrow">Opening {title}</p>
          </div>
        )}

        <div key={turnKey} className="relative">
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            aria-label={`Page ${page} of ${title}`}
          />
          {rendering && !loading && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <Loader2 className="size-6 animate-spin text-wine-soft" aria-hidden />
            </div>
          )}
        </div>
      </div>

      {/* Mobile paging bar */}
      {/* A phone gets full-width paging targets rather than 32px icon buttons. */}
      <div className="flex items-center gap-2.5 border-t border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-2.5 sm:hidden">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] text-sm font-semibold text-[rgb(var(--text))] disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </button>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={numPages > 0 && page >= numPages}
          className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white disabled:opacity-30"
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
