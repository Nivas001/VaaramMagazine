/**
 * Impression and click counting for every advertisement on a page.
 *
 * A side rail can hold twenty cards. Counting each one with its own request
 * would fire twenty POSTs per page view and walk straight into the website's
 * own rate limit, losing counts silently — and those counts are what an
 * advertiser is billed against. So this is one module-level observer and one
 * shared queue: every rail, carousel and grid on the page registers with it,
 * and the whole page's impressions leave in a single request.
 *
 * What counts as an impression is deliberately strict. A card must be at least
 * half on screen and stay there for a full second. A reader flicking past at
 * speed has not seen an advertisement, and saying they did would make the
 * numbers indefensible the first time a client checked them.
 *
 * Browser-only. Every entry point no-ops during server rendering.
 */

const VISIBLE_RATIO = 0.5;
/** How long a card must stay on screen before it counts. */
const DWELL_MS = 1000;
/** Wait this long for more cards before sending, so a scroll sends once. */
const DEBOUNCE_MS = 2000;
/** Send immediately once the queue reaches a rail's worth. */
const FLUSH_AT = 20;

const queue = new Set<string>();
/**
 * Counted per *element*, not per banner id. An element counts once for as long
 * as it is mounted; a move to another page builds new elements, so the same
 * banner correctly counts again as a new page view. That needs no reset hook
 * and no route plumbing.
 */
const counted = new WeakSet<Element>();
const ids = new WeakMap<Element, string>();
const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
const visibilityCallbacks = new WeakMap<Element, (visible: boolean) => void>();

let observer: IntersectionObserver | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function post(body: unknown) {
  const json = JSON.stringify(body);

  // A beacon survives the page being closed, which a plain fetch may not.
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    if (navigator.sendBeacon("/api/track", blob)) return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.size === 0) return;

  const batch = [...queue];
  queue.clear();
  post({ type: "banner_impressions", ids: batch });
}

function bindListeners() {
  if (listenersBound || typeof document === "undefined") return;
  listenersBound = true;

  // Both, deliberately: `visibilitychange` catches a tab being switched away
  // from, `pagehide` catches the page actually going. Never `unload` — it
  // disables the back/forward cache.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

function schedule() {
  bindListeners();
  if (queue.size >= FLUSH_AT) {
    flush();
    return;
  }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, DEBOUNCE_MS);
}

/** Records one banner as seen. Sent with the rest of the page's batch. */
export function queueImpression(id: string) {
  if (!id) return;
  queue.add(id);
  schedule();
}

function getObserver() {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;

        const notify = visibilityCallbacks.get(el);
        if (notify) {
          notify(entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO);
          continue;
        }

        const pending = timers.get(el);

        if (!entry.isIntersecting || entry.intersectionRatio < VISIBLE_RATIO) {
          // Scrolled away before the dwell elapsed — it was never seen.
          if (pending) {
            clearTimeout(pending);
            timers.delete(el);
          }
          continue;
        }

        if (pending || counted.has(el)) continue;

        timers.set(
          el,
          setTimeout(() => {
            timers.delete(el);
            if (counted.has(el)) return;
            counted.add(el);
            observer?.unobserve(el);
            const id = ids.get(el);
            if (id) queueImpression(id);
          }, DWELL_MS)
        );
      }
    },
    { threshold: [0, VISIBLE_RATIO] }
  );

  return observer;
}

/**
 * Counts one banner element as seen once it has dwelled on screen.
 *
 * A hidden element never intersects, so the copy of a rail that a breakpoint
 * has switched off costs nothing and can never double-count.
 *
 * Returns the cleanup to run when the element unmounts.
 */
export function observeAd(el: Element | null, id: string): () => void {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};

  ids.set(el, id);
  getObserver().observe(el);

  return () => {
    const pending = timers.get(el);
    if (pending) {
      clearTimeout(pending);
      timers.delete(el);
    }
    observer?.unobserve(el);
  };
}

/**
 * Reports whether an element is on screen, without counting anything.
 *
 * The rotating strips need this: they decide for themselves which of their
 * banners is showing, and must not count a slide that turned over in a tab
 * nobody is looking at.
 */
export function observeVisible(
  el: Element | null,
  onChange: (visible: boolean) => void
): () => void {
  if (!el || typeof IntersectionObserver === "undefined") {
    // Without the API, assume visible rather than counting nothing at all.
    onChange(true);
    return () => {};
  }

  visibilityCallbacks.set(el, onChange);
  getObserver().observe(el);

  return () => {
    visibilityCallbacks.delete(el);
    observer?.unobserve(el);
  };
}

/**
 * A click is sent on its own and at once — there are few of them, and the
 * reader is leaving for the advertiser's site as it fires.
 */
export function trackClick(id: string) {
  if (!id) return;
  // Anything already waiting goes with it, since the page may not come back.
  flush();
  post({ type: "banner_click", id });
}
