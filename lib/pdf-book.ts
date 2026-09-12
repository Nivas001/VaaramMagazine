"use client";

/**
 * The document engine behind the reader.
 *
 * Everything the flipbook needs from a PDF goes through here: rasterised page
 * images, thumbnails, the text behind each page (for selection and search),
 * the links printed in it, and the outline if the file carries one.
 *
 * Three ideas hold the whole thing together:
 *
 *  · **One document, one engine.** pdf.js is loaded once per page load and the
 *    document once per edition. Every panel — the book, the thumbnail rail,
 *    the search — reads from the same instance, so opening the thumbnails
 *    never re-downloads anything.
 *
 *  · **Rasters are cached and bucketed.** A page is rendered at a width
 *    rounded up to the next 128px step, so nudging a window edge does not
 *    re-render sixty pages. Full pages are held in a small LRU (a spread plus
 *    its neighbours); thumbnails are tiny and kept for the session.
 *
 *  · **Nothing here throws at the caller.** A page that will not render comes
 *    back as null and the reader shows what it already had. A broken edition
 *    must never take the reading surface down with it.
 */

type PdfjsModule = typeof import("pdfjs-dist");

/** A rectangle in page space, normalised to 0..1 so it survives any zoom. */
export type Rect = { x: number; y: number; w: number; h: number };

export type PageTextItem = { text: string; rect: Rect };
export type PageLink = { href: string; rect: Rect; kind: LinkKind };
export type LinkKind = "url" | "tel" | "mail" | "page";
export type PageImage = {
  url: string;
  /** Raster size in device pixels. */
  width: number;
  height: number;
};
export type PageSize = { width: number; height: number };
export type OutlineNode = { title: string; page: number | null; children: OutlineNode[] };
export type SearchHit = { page: number; text: string; rects: Rect[] };

/** Raster width is rounded up to this step so resizing does not thrash. */
const WIDTH_STEP = 128;
/** No page is ever rasterised wider than this, whatever the zoom. */
const MAX_RASTER_WIDTH = 2600;
/** Full-size pages held at once: the open spread, both neighbours, headroom. */
const PAGE_CACHE_LIMIT = 14;
const THUMB_WIDTH = 150;

/**
 * Phone numbers, e-mail addresses and bare domains printed in an advertisement
 * become tappable. In a classifieds magazine read mostly on a phone this is
 * the single most useful thing the reader does — nobody wants to copy a number
 * out by hand — so it is detected even when the PDF carries no link
 * annotation, which is the normal case for artwork placed as an image.
 */
const TEL_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const MAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const URL_RE = /(?:https?:\/\/|www\.)[^\s<>"']+|(?:[A-Za-z0-9-]+\.)+(?:com|ca|org|net|co|info|lk|in|biz)\b(?:\/[^\s<>"']*)?/;

let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      // Served from our own /public folder: the reader keeps working when a
      // CDN is blocked, and the worker can never drift out of version sync.
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

/** Device pixel ratio, capped. A 3× phone would otherwise triple every cost. */
export function rasterDpr() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}

type CachedImage = PageImage & { key: string };

export class PdfBook {
  readonly numPages: number;

  private doc: any;
  private loadingTask: any;
  private pdfjs: PdfjsModule;

  private pageCache = new Map<string, CachedImage>();
  private thumbCache = new Map<number, PageImage>();
  private inFlight = new Map<string, Promise<PageImage | null>>();
  private sizes = new Map<number, PageSize>();
  private textCache = new Map<number, PageTextItem[]>();
  private linkCache = new Map<number, PageLink[]>();
  private destroyed = false;

  private constructor(pdfjs: PdfjsModule, doc: any, loadingTask: any) {
    this.pdfjs = pdfjs;
    this.doc = doc;
    this.loadingTask = loadingTask;
    this.numPages = doc.numPages;
  }

  static async open(url: string): Promise<PdfBook> {
    const pdfjs = await loadPdfjs();
    const loadingTask = pdfjs.getDocument({
      url,
      // Stream byte ranges rather than pulling a 20 MB edition up front.
      disableAutoFetch: true,
      disableStream: false,
    });
    const doc = await loadingTask.promise;
    return new PdfBook(pdfjs, doc, loadingTask);
  }

  /* ── Geometry ─────────────────────────────────────────────────────────── */

  /** The page's size in CSS pixels at scale 1. Cheap, and cached. */
  async pageSize(pageNumber: number): Promise<PageSize> {
    const known = this.sizes.get(pageNumber);
    if (known) return known;
    const page = await this.doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const size = { width: viewport.width, height: viewport.height };
    this.sizes.set(pageNumber, size);
    return size;
  }

  /* ── Rasters ──────────────────────────────────────────────────────────── */

  /**
   * A page image at least `cssWidth` wide.
   *
   * Returns immediately from cache when a raster of the right bucket exists,
   * which is what makes paging back and forth through a spread instant.
   */
  getPage(pageNumber: number, cssWidth: number): Promise<PageImage | null> {
    const target = Math.min(
      Math.ceil((cssWidth * rasterDpr()) / WIDTH_STEP) * WIDTH_STEP,
      MAX_RASTER_WIDTH
    );
    const key = `${pageNumber}@${target}`;

    const cached = this.pageCache.get(key);
    if (cached) {
      // Touch for LRU ordering.
      this.pageCache.delete(key);
      this.pageCache.set(key, cached);
      return Promise.resolve(cached);
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const job = this.rasterise(pageNumber, target)
      .then((image) => {
        if (!image || this.destroyed) return image;
        this.pageCache.set(key, { ...image, key });
        this.evict();
        return image;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, job);
    return job;
  }

  /**
   * The best raster of this page already in memory, at any size.
   *
   * Used to keep something on screen while a sharper pass renders, so zooming
   * never flashes an empty sheet.
   */
  peekPage(pageNumber: number): PageImage | null {
    let best: CachedImage | null = null;
    for (const image of this.pageCache.values()) {
      if (!image.key.startsWith(`${pageNumber}@`)) continue;
      if (!best || image.width > best.width) best = image;
    }
    return best ?? this.thumbCache.get(pageNumber) ?? null;
  }

  async getThumbnail(pageNumber: number): Promise<PageImage | null> {
    const cached = this.thumbCache.get(pageNumber);
    if (cached) return cached;
    const key = `thumb:${pageNumber}`;
    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const job = this.rasterise(pageNumber, THUMB_WIDTH)
      .then((image) => {
        if (image && !this.destroyed) this.thumbCache.set(pageNumber, image);
        return image;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, job);
    return job;
  }

  /**
   * Render ahead so the next turn has nothing to wait for.
   *
   * Strictly one page at a time, yielding between each. Firing the whole
   * neighbourhood at once looks harmless until the edition is a real one — a
   * five-megabyte, fourteen-page paper — and then eight simultaneous
   * rasterisations hold the main thread long enough that the page stops
   * responding to the reader entirely.
   *
   * The queue is replaced rather than appended to, so turning a page abandons
   * the work queued for where the reader used to be. Pages actually on screen
   * never come through here: `PageFace` asks for those directly and jumps the
   * queue.
   */
  prefetch(pageNumbers: number[], cssWidth: number) {
    this.queue = pageNumbers
      .filter((n) => n >= 1 && n <= this.numPages)
      .map((page) => ({ page, width: cssWidth }));
    void this.drain();
  }

  private queue: { page: number; width: number }[] = [];
  private draining = false;

  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0 && !this.destroyed) {
        const job = this.queue.shift();
        if (!job) break;
        await this.getPage(job.page, job.width);
        // Hand the thread back between pages: a turn, a tap or a scroll must
        // never be stuck behind work nobody has asked to see yet.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      this.draining = false;
    }
  }

  private async rasterise(pageNumber: number, rasterWidth: number): Promise<PageImage | null> {
    if (this.destroyed) return null;
    try {
      const page = await this.doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      this.sizes.set(pageNumber, { width: base.width, height: base.height });

      const viewport = page.getViewport({ scale: rasterWidth / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return null;
      // Printed pages are white to the trim. Painting the ground first stops a
      // transparent margin showing the dark reading room through the sheet.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.86)
      );

      const width = canvas.width;
      const height = canvas.height;
      // Release the backing store now rather than at the next collection.
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();

      if (!blob || this.destroyed) return null;
      return { url: URL.createObjectURL(blob), width, height };
    } catch (error: any) {
      if (error?.name !== "RenderingCancelledException") {
        console.warn("[pdf-book] render", pageNumber, error);
      }
      return null;
    }
  }

  private evict() {
    while (this.pageCache.size > PAGE_CACHE_LIMIT) {
      const oldest = this.pageCache.keys().next().value as string | undefined;
      if (!oldest) break;
      const image = this.pageCache.get(oldest);
      this.pageCache.delete(oldest);
      if (image) URL.revokeObjectURL(image.url);
    }
  }

  /* ── Text, links, outline ─────────────────────────────────────────────── */

  /** Every text run on the page, boxed and normalised to 0..1. */
  async getText(pageNumber: number): Promise<PageTextItem[]> {
    const cached = this.textCache.get(pageNumber);
    if (cached) return cached;

    let items: PageTextItem[] = [];
    try {
      const page = await this.doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const { Util } = this.pdfjs;

      items = (content.items as any[])
        .filter((item) => typeof item.str === "string" && item.str.trim().length > 0)
        .map((item) => {
          const tx = Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]) || item.height || 10;
          return {
            text: item.str as string,
            rect: {
              x: tx[4] / viewport.width,
              y: (tx[5] - fontHeight) / viewport.height,
              w: (item.width || 0) / viewport.width,
              h: fontHeight / viewport.height,
            },
          };
        });
      page.cleanup();
    } catch (error) {
      console.warn("[pdf-book] text", pageNumber, error);
    }

    this.textCache.set(pageNumber, items);
    return items;
  }

  /**
   * Links on the page: the ones the PDF declares, plus phone numbers, e-mail
   * addresses and web addresses found in the text.
   */
  async getLinks(pageNumber: number): Promise<PageLink[]> {
    const cached = this.linkCache.get(pageNumber);
    if (cached) return cached;

    const links: PageLink[] = [];

    try {
      const page = await this.doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const annotations = await page.getAnnotations({ intent: "display" });
      const { Util } = this.pdfjs;

      for (const a of annotations as any[]) {
        if (a.subtype !== "Link") continue;
        const href: string | undefined = a.url ?? a.unsafeUrl;
        if (!href) continue;
        const r = Util.normalizeRect(a.rect);
        const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(r);
        links.push({
          href,
          kind: hrefKind(href),
          rect: {
            x: Math.min(x1, x2) / viewport.width,
            y: Math.min(y1, y2) / viewport.height,
            w: Math.abs(x2 - x1) / viewport.width,
            h: Math.abs(y2 - y1) / viewport.height,
          },
        });
      }
      page.cleanup();
    } catch (error) {
      console.warn("[pdf-book] links", pageNumber, error);
    }

    // Detected contacts come second so a real annotation always wins the same
    // spot: the publisher's own link is more trustworthy than our guess.
    const text = await this.getText(pageNumber);
    for (const item of text) {
      const detected = detectContact(item.text);
      if (!detected) continue;
      if (links.some((l) => overlaps(l.rect, item.rect))) continue;
      links.push({ href: detected.href, kind: detected.kind, rect: item.rect });
    }

    this.linkCache.set(pageNumber, links);
    return links;
  }

  async getOutline(): Promise<OutlineNode[]> {
    try {
      const raw = await this.doc.getOutline();
      if (!Array.isArray(raw) || raw.length === 0) return [];
      const walk = async (nodes: any[]): Promise<OutlineNode[]> =>
        Promise.all(
          nodes.map(async (node) => ({
            title: String(node.title ?? "").trim() || "Untitled",
            page: await this.destinationPage(node.dest),
            children: node.items?.length ? await walk(node.items) : [],
          }))
        );
      return await walk(raw);
    } catch {
      return [];
    }
  }

  private async destinationPage(dest: any): Promise<number | null> {
    try {
      const resolved = typeof dest === "string" ? await this.doc.getDestination(dest) : dest;
      if (!Array.isArray(resolved) || !resolved[0]) return null;
      const index = await this.doc.getPageIndex(resolved[0]);
      return index + 1;
    } catch {
      return null;
    }
  }

  /* ── Search ───────────────────────────────────────────────────────────── */

  /**
   * Walks the edition looking for `query`, handing results back page by page
   * so the panel fills in as it goes rather than staring at a spinner.
   */
  async search(
    query: string,
    { signal, onHit }: { signal?: AbortSignal; onHit?: (hit: SearchHit) => void } = {}
  ): Promise<SearchHit[]> {
    const needle = query.trim().toLowerCase();
    const hits: SearchHit[] = [];
    if (needle.length < 2) return hits;

    for (let n = 1; n <= this.numPages; n++) {
      if (signal?.aborted) break;
      const items = await this.getText(n);
      if (signal?.aborted) break;

      const matched = items.filter((item) => item.text.toLowerCase().includes(needle));
      if (matched.length === 0) continue;

      // One row per page, with every rect on it, rather than a row per word:
      // a reader scanning results wants pages, not occurrences.
      const hit: SearchHit = {
        page: n,
        text: snippet(matched.map((m) => m.text).join(" "), needle),
        rects: matched.map((m) => m.rect),
      };
      hits.push(hit);
      onHit?.(hit);

      // Let the browser breathe between pages; search must never freeze a scroll.
      await new Promise((r) => setTimeout(r, 0));
    }

    return hits;
  }

  /* ── Teardown ─────────────────────────────────────────────────────────── */

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const image of this.pageCache.values()) URL.revokeObjectURL(image.url);
    for (const image of this.thumbCache.values()) URL.revokeObjectURL(image.url);
    this.queue = [];
    this.pageCache.clear();
    this.thumbCache.clear();
    this.textCache.clear();
    this.linkCache.clear();
    void this.loadingTask?.destroy?.();
    this.doc = null;
  }
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function hrefKind(href: string): LinkKind {
  if (href.startsWith("tel:")) return "tel";
  if (href.startsWith("mailto:")) return "mail";
  return "url";
}

/**
 * Turns one run of page text into a link, if it is unambiguously a contact.
 *
 * Deliberately conservative: a run containing anything other than the match
 * and a little punctuation is left alone, because a false link over body copy
 * is far more annoying than a missed one.
 */
function detectContact(raw: string): { href: string; kind: LinkKind } | null {
  const text = raw.trim();
  if (text.length < 7 || text.length > 120) return null;

  const mail = text.match(MAIL_RE);
  if (mail && mail[0].length / text.length > 0.6) {
    return { href: `mailto:${mail[0]}`, kind: "mail" };
  }

  const url = text.match(URL_RE);
  if (url && url[0].length / text.length > 0.6) {
    const href = url[0].startsWith("http") ? url[0] : `https://${url[0]}`;
    return { href, kind: "url" };
  }

  const tel = text.match(TEL_RE);
  if (tel && tel[0].length / text.length > 0.75) {
    const digits = tel[0].replace(/[^\d+]/g, "");
    // Ten digits is a North American number; anything shorter is a price, a
    // date or a lot number, and must not become a call link.
    if (digits.replace(/\D/g, "").length >= 10 && digits.replace(/\D/g, "").length <= 15) {
      return { href: `tel:${digits}`, kind: "tel" };
    }
  }

  return null;
}

function overlaps(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function snippet(text: string, needle: string) {
  const at = text.toLowerCase().indexOf(needle);
  if (at < 0) return text.slice(0, 90);
  const from = Math.max(0, at - 34);
  const out = text.slice(from, from + 110).trim();
  return (from > 0 ? "…" : "") + out + (from + 110 < text.length ? "…" : "");
}
