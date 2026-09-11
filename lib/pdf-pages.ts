"use client";

/**
 * Rasterises the opening pages of a PDF into images, one at a time.
 *
 * Used by the home page, where the current edition flips through its own
 * pages rather than sitting still as a cover. Two things make that affordable
 * on a page nobody came to read a PDF on:
 *
 *  · pdf.js is asked for the file with streaming on and auto-fetch off, so it
 *    pulls byte ranges for the pages actually rendered instead of the whole
 *    edition. A 5 MB newspaper costs a few hundred kilobytes to show six
 *    pages of.
 *  · Pages are handed back through `onPage` as each one finishes, so the
 *    caller can start animating on page two while the rest are still coming.
 *
 * Everything is best-effort. A failure here means the caller keeps showing the
 * static cover it already had, which is why nothing throws.
 */

export type RenderedPage = {
  /** An object URL. The caller owns it and must revoke it when done. */
  url: string;
  width: number;
  height: number;
};

export type RenderPagesOptions = {
  /** Never render more than this, however long the edition is. */
  maxPages?: number;
  /** CSS pixels the page is displayed at; the render is sized for 2× that. */
  displayWidth?: number;
  /** Abort mid-run — the caller unmounting, usually. */
  signal?: AbortSignal;
  /** Called as each page finishes, in order. */
  onPage?: (page: RenderedPage, index: number) => void;
};

export async function renderPdfPages(
  url: string,
  { maxPages = 6, displayWidth = 440, signal, onPage }: RenderPagesOptions = {}
): Promise<RenderedPage[]> {
  const out: RenderedPage[] = [];

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // Same load options the reader uses: stream the file, and do not greedily
  // fetch pages nobody has asked for.
  const loadingTask = pdfjs.getDocument({
    url,
    disableAutoFetch: true,
    disableStream: false,
  });

  try {
    const doc = await loadingTask.promise;
    if (signal?.aborted) return out;

    const count = Math.min(doc.numPages, maxPages);
    // Cap the device pixel ratio: a 3× phone would otherwise triple the
    // rasterising cost for a picture a few hundred pixels wide.
    const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2);

    for (let n = 1; n <= count; n++) {
      if (signal?.aborted) break;

      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (displayWidth * dpr) / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) break;
      // Newspaper pages are white to the trim; painting the ground first
      // stops a transparent margin showing the dark hero through the sheet.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      if (signal?.aborted) break;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
      );
      // Release the backing store now rather than at the next collection —
      // six full-page canvases is real memory on a cheap phone.
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      if (!blob || signal?.aborted) break;

      const rendered: RenderedPage = {
        url: URL.createObjectURL(blob),
        width: viewport.width,
        height: viewport.height,
      };
      out.push(rendered);
      onPage?.(rendered, out.length - 1);
    }
  } catch (error) {
    console.warn("[pdf-pages]", error);
  } finally {
    void loadingTask.destroy();
  }

  return out;
}
