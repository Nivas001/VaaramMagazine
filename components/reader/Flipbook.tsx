"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PageSize, PdfBook, Rect } from "@/lib/pdf-book";
import { playPageTurn } from "@/lib/page-sound";
import { BookLeaf, type LeafHandle } from "./BookLeaf";
import { PageFace } from "./PageFace";
import { cn } from "@/lib/utils";

/**
 * The reading surface: an open magazine you can turn, drag and zoom.
 *
 * ── How the book is paginated ──────────────────────────────────────────────
 * A printed magazine does not show pages in pairs from the start. The cover
 * stands alone on the right, then 2–3 face each other, then 4–5, and the last
 * page stands alone on the left. So the unit here is a *spread*, not a page:
 *
 *     spread 0 → [ —, 1 ]      spread k → [ 2k, 2k+1 ]
 *
 * ── How a turn works ───────────────────────────────────────────────────────
 * One leaf is hinged at the spine and carries two faces: page 2k+1 on the
 * front and 2k+2 on the back. Turning forward swings it from the right onto
 * the left; turning back swings the leaf before it the other way. Because both
 * directions are the same sheet on the same hinge, there is a single geometry
 * and a single progress value, 0 (lying right) to 1 (lying left).
 *
 * Underneath, the two static halves already show where the reader is going,
 * so the turn never waits on a render and never swings over a blank.
 *
 * ── How pointers are shared ────────────────────────────────────────────────
 * The same drag has to mean two different things, so it is decided by whether
 * the reader has zoomed in:
 *
 *   · at fit size — dragging peels the page, following the pointer, and lets
 *     go where you let go of it;
 *   · zoomed in   — dragging pans the page under the window, with the wheel,
 *     trackpad and scrollbars all still working exactly as they did. Both ways
 *     of moving around a zoomed page stay available; neither replaces the
 *     other.
 *
 * On touch the split is the same, except the browser does the panning itself:
 * native scrolling beats anything re-implemented in JavaScript. Two fingers
 * pinch to zoom at any time.
 */

export type FlipbookHandle = {
  /** Turn one spread forward (1) or back (-1). */
  turn: (direction: 1 | -1) => void;
  /** Jump to a page, animating only if it is the very next spread. */
  goToPage: (page: number) => void;
};

export type Tone = "paper" | "sepia" | "night";

const TURN_MS = 720;
const DRAG_THRESHOLD = 7;
/**
 * Narrower than this, the reader shows one page at a time.
 *
 * Set so that a phone turned sideways still gets the spread — 812px is the
 * narrowest common landscape width — while a portrait phone, or a desktop
 * column sharing its row with the advertisement rail, does not.
 */
export const SPREAD_MIN_WIDTH = 760;

export const Flipbook = forwardRef<
  FlipbookHandle,
  {
    book: PdfBook;
    page: number;
    onPageChange: (page: number) => void;
    /** Two pages side by side. The caller decides; this only obeys. */
    spread: boolean;
    fit: "page" | "width";
    zoom: number;
    onZoomChange: (zoom: number) => void;
    tone: Tone;
    sound: boolean;
    reducedMotion: boolean;
    /** Makes the invisible text layer live, so the page can be selected. */
    selectable: boolean;
    /** Outlines every link at once. */
    litLinks: boolean;
    highlights?: Map<number, Rect[]>;
    activeHighlight?: { page: number; rect: Rect } | null;
    onFirstPaint?: () => void;
  }
>(function Flipbook(
  {
    book,
    page,
    onPageChange,
    spread: spreadMode,
    fit,
    zoom,
    onZoomChange,
    tone,
    sound,
    reducedMotion,
    selectable,
    litLinks,
    highlights,
    activeHighlight,
    onFirstPaint,
  },
  ref
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<LeafHandle>(null);
  const leftShadeRef = useRef<HTMLDivElement>(null);
  const rightShadeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const [natural, setNatural] = useState<PageSize | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  /* ── Pagination ───────────────────────────────────────────────────────── */

  const lastIndex = spreadMode ? Math.floor(book.numPages / 2) : book.numPages - 1;

  const leftOf = useCallback(
    (index: number): number | null => {
      if (!spreadMode) return null;
      if (index <= 0) return null;
      const n = index * 2;
      return n <= book.numPages ? n : null;
    },
    [spreadMode, book.numPages]
  );

  const rightOf = useCallback(
    (index: number): number | null => {
      const n = spreadMode ? index * 2 + 1 : index + 1;
      return n >= 1 && n <= book.numPages ? n : null;
    },
    [spreadMode, book.numPages]
  );

  const indexOfPage = useCallback(
    (p: number) => {
      const clamped = Math.min(Math.max(p, 1), book.numPages);
      return spreadMode ? Math.floor(clamped / 2) : clamped - 1;
    },
    [spreadMode, book.numPages]
  );

  const primaryPage = useCallback(
    (index: number) => leftOf(index) ?? rightOf(index) ?? 1,
    [leftOf, rightOf]
  );

  const [index, setIndex] = useState(() => indexOfPage(page));
  const indexRef = useRef(index);
  indexRef.current = index;

  /* ── The sheet currently in motion ────────────────────────────────────── */

  type Turn = {
    key: number;
    direction: 1 | -1;
    to: number;
    front: number | null;
    back: number | null;
    underLeft: number | null;
    underRight: number | null;
  };
  const [turn, setTurnState] = useState<Turn | null>(null);
  const turnRef = useRef<Turn | null>(null);
  /* The ref and the state must move together: the pointer handlers read the
     turn synchronously, mid-gesture, long before React has re-rendered. */
  const setTurn = useCallback((next: Turn | null) => {
    turnRef.current = next;
    setTurnState(next);
  }, []);

  const buildTurn = useCallback(
    (from: number, direction: 1 | -1): Turn | null => {
      const to = from + direction;
      if (to < 0 || to > lastIndex) return null;
      const hinge = direction === 1 ? from : to;
      return {
        key: Date.now(),
        direction,
        to,
        front: rightOf(hinge),
        back: spreadMode ? leftOf(hinge + 1) : null,
        underLeft: leftOf(direction === 1 ? from : to),
        underRight: rightOf(direction === 1 ? to : from),
      };
    },
    [lastIndex, rightOf, leftOf, spreadMode]
  );

  /* ── Geometry ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    void book.pageSize(1).then((size) => !cancelled && setNatural(size));
    return () => {
      cancelled = true;
    };
  }, [book]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // Only a real change is published: an identical object would still
    // re-render, and re-rendering from inside a ResizeObserver is how these
    // loops start.
    const measure = () =>
      setBox((previous) =>
        previous.w === el.clientWidth && previous.h === el.clientHeight
          ? previous
          : { w: el.clientWidth, h: el.clientHeight }
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!natural || box.w === 0) return null;
    const pw = natural.width;
    const ph = natural.height;
    const bookW0 = spreadMode ? pw * 2 : pw;

    // A little air around the book so its shadow is not clipped by the frame.
    const availW = Math.max(box.w - 28, 160);
    const availH = Math.max(box.h - 28, 200);

    const fitScale =
      fit === "width" ? availW / bookW0 : Math.min(availW / bookW0, availH / ph);
    const scale = fitScale * zoom;

    return {
      fitScale,
      scale,
      pageW: pw * scale,
      pageH: ph * scale,
      bookW: bookW0 * scale,
      bookH: ph * scale,
    };
  }, [natural, box.w, box.h, spreadMode, fit, zoom]);

  const zoomed = Boolean(layout && zoom > 1.001);

  /* ── Raster prefetch around where the reader is ───────────────────────── */
  useEffect(() => {
    if (!layout) return;
    const around = [index - 1, index, index + 1, index + 2]
      .filter((i) => i >= 0 && i <= lastIndex)
      .flatMap((i) => [leftOf(i), rightOf(i)])
      .filter((n): n is number => n !== null);
    // Deliberately the *fit* width, not the zoomed one. Only the pages on
    // screen need a raster drawn for a 5× zoom; rendering the neighbours that
    // large as well would cost eight full-resolution pages nobody is looking
    // at, and PageFace asks for the sharp version itself when its turn comes.
    book.prefetch(around, layout.pageW / Math.max(zoom, 1));
  }, [book, index, lastIndex, layout, zoom, leftOf, rightOf]);

  /* ── Driving the animation ────────────────────────────────────────────── */

  const paint = useCallback((p: number) => {
    leafRef.current?.setProgress(p);
    // The sheet throws a shadow onto whichever half it is passing over.
    const cast = Math.sin(Math.PI * Math.min(Math.max(p, 0), 1));
    if (rightShadeRef.current) {
      rightShadeRef.current.style.opacity = String(p <= 0.5 ? cast * 0.3 : 0);
    }
    if (leftShadeRef.current) {
      leftShadeRef.current.style.opacity = String(p > 0.5 ? cast * 0.3 : 0);
    }
  }, []);

  const settle = useCallback(
    (from: number, to: number, activeTurn: Turn, commit: boolean) => {
      cancelAnimationFrame(rafRef.current);

      const finish = () => {
        paint(to);
        if (commit) {
          setIndex(activeTurn.to);
          onPageChange(primaryPage(activeTurn.to));
        }
        setTurn(null);
      };

      if (reducedMotion) {
        finish();
        return;
      }

      const distance = Math.abs(to - from);
      const duration = Math.max(160, TURN_MS * distance);
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Fast off the spine, easing onto the stack — the shape of a real turn.
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        paint(from + (to - from) * eased);
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else finish();
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [paint, onPageChange, primaryPage, reducedMotion]
  );

  const startTurn = useCallback(
    (direction: 1 | -1) => {
      if (turnRef.current) return;
      const next = buildTurn(indexRef.current, direction);
      if (!next) return;

      setTurn(next);
      if (sound) playPageTurn();

      // The leaf mounts on the next commit, so hand it its opening position
      // and the animation on the frame after that.
      const from = direction === 1 ? 0 : 1;
      const to = direction === 1 ? 1 : 0;
      requestAnimationFrame(() => {
        paint(from);
        requestAnimationFrame(() => settle(from, to, next, true));
      });
    },
    [buildTurn, paint, settle, sound]
  );

  const goToPage = useCallback(
    (target: number) => {
      const nextIndex = indexOfPage(target);
      if (nextIndex === indexRef.current) {
        onPageChange(target);
        return;
      }
      const step = nextIndex - indexRef.current;
      if (Math.abs(step) === 1 && !turnRef.current && !reducedMotion) {
        startTurn(step > 0 ? 1 : -1);
        return;
      }
      cancelAnimationFrame(rafRef.current);
      setTurn(null);
      setIndex(nextIndex);
      onPageChange(target);
    },
    [indexOfPage, onPageChange, startTurn, reducedMotion]
  );

  useImperativeHandle(
    ref,
    () => ({
      turn: (direction) => startTurn(direction),
      goToPage,
    }),
    [startTurn, goToPage]
  );

  /* Follow the page the caller asks for — the page box, a thumbnail, a hit. */
  useEffect(() => {
    const target = indexOfPage(page);
    if (target === indexRef.current || turnRef.current) return;
    const step = target - indexRef.current;
    if (Math.abs(step) === 1 && !reducedMotion) startTurn(step > 0 ? 1 : -1);
    else setIndex(target);
  }, [page, indexOfPage, startTurn, reducedMotion]);

  /* Switching between one page and two keeps the reader on the same page. */
  useEffect(() => {
    setIndex(indexOfPage(page));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadMode]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* ── Pointers ─────────────────────────────────────────────────────────── */

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
    mode: "undecided" | "pan" | "turn";
    direction: 0 | 1 | -1;
    progress: number;
    touch: boolean;
  } | null>(null);

  /**
   * Pointer capture keeps a drag alive when the pointer leaves the book, which
   * matters because a page turn ends well outside it. It is best-effort: the
   * call throws for a pointer the browser no longer considers active, and a
   * capture that could not be taken must never be the reason a page refuses to
   * turn — so it happens after the turn is committed, and never throws.
   */
  const capture = (pointerId: number) => {
    try {
      stageRef.current?.setPointerCapture(pointerId);
    } catch {
      /* The drag still works; it just stops if the pointer leaves the stage. */
    }
  };
  const release = (pointerId: number) => {
    try {
      stageRef.current?.releasePointerCapture(pointerId);
    } catch {
      /* Already released, or never captured. */
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
      return;
    }
    if (pointers.current.size > 2) return;

    // Never hijack a press on a link or a button printed in the page — and
    // when the reader has asked to select text, the drag is theirs, not ours.
    if (selectable || (e.target as HTMLElement).closest("a,button")) return;

    const stage = stageRef.current;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      scrollLeft: stage?.scrollLeft ?? 0,
      scrollTop: stage?.scrollTop ?? 0,
      mode: "undecided",
      direction: 0,
      progress: 0,
      touch: e.pointerType === "touch",
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    /* Two fingers: pinch to zoom, at any magnification. */
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.distance > 0) {
        const next = pinch.current.zoom * (distance / pinch.current.distance);
        onZoomChange(Math.min(Math.max(next, 1), 5));
      }
      return;
    }

    const state = drag.current;
    if (!state || state.id !== e.pointerId) return;

    const dx = e.clientX - state.x;
    const dy = e.clientY - state.y;

    if (state.mode === "undecided") {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (zoomed) {
        // Touch already pans natively and does it better; leave it alone.
        if (state.touch) {
          drag.current = null;
          return;
        }
        state.mode = "pan";
        stageRef.current?.classList.add("pdf-stage-panning");
        capture(e.pointerId);
      } else {
        if (Math.abs(dx) <= Math.abs(dy)) {
          // A vertical drag on an unzoomed page is the reader scrolling the
          // article around the reader, not turning a page.
          drag.current = null;
          return;
        }
        const direction: 1 | -1 = dx < 0 ? 1 : -1;
        const candidate = buildTurn(indexRef.current, direction);
        if (!candidate) {
          drag.current = null;
          return;
        }
        state.mode = "turn";
        state.direction = direction;
        setTurn(candidate);
        capture(e.pointerId);
        if (sound) playPageTurn();
        requestAnimationFrame(() => paint(direction === 1 ? 0 : 1));
      }
    }

    if (state.mode === "pan") {
      const stage = stageRef.current;
      if (stage) {
        stage.scrollLeft = state.scrollLeft - dx;
        stage.scrollTop = state.scrollTop - dy;
      }
      return;
    }

    if (state.mode === "turn" && layout) {
      // The sheet follows the finger: dragging it the width of one page is a
      // complete turn, so the page tracks the pointer one-for-one.
      const travel = Math.min(Math.max(Math.abs(dx) / layout.pageW, 0), 1);
      const progress = state.direction === 1 ? travel : 1 - travel;
      state.progress = progress;
      paint(progress);
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;

    const state = drag.current;
    if (!state || state.id !== e.pointerId) return;
    drag.current = null;
    stageRef.current?.classList.remove("pdf-stage-panning");
    release(e.pointerId);

    const active = turnRef.current;
    if (state.mode !== "turn" || !active) return;

    // Past half way the page falls open; short of it, it springs back.
    const forward = state.direction === 1;
    const committed = forward ? state.progress > 0.5 : state.progress < 0.5;
    const target = committed ? (forward ? 1 : 0) : forward ? 0 : 1;
    settle(state.progress, target, active, committed);
  };

  /* ── Wheel, double click ──────────────────────────────────────────────── */

  /**
   * Ctrl/⌘ + wheel zooms; a plain wheel or trackpad scroll is left entirely to
   * the browser, so a zoomed page still scrolls the way every other page on
   * the web does. The listener is registered by hand because it has to be
   * non-passive to call preventDefault, and React attaches its own passively.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const next = zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12);
      onZoomChange(Math.min(Math.max(next, 1), 5));
    };
    stage.addEventListener("wheel", handler, { passive: false });
    return () => stage.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (zoomed) {
      onZoomChange(1);
      return;
    }
    // Zoom towards what was pointed at, not towards the middle of the book.
    const rect = stage.getBoundingClientRect();
    const px = (stage.scrollLeft + e.clientX - rect.left) / Math.max(stage.scrollWidth, 1);
    const py = (stage.scrollTop + e.clientY - rect.top) / Math.max(stage.scrollHeight, 1);
    onZoomChange(2);
    requestAnimationFrame(() => {
      stage.scrollLeft = px * stage.scrollWidth - rect.width / 2;
      stage.scrollTop = py * stage.scrollHeight - rect.height / 2;
    });
  };

  /* ── First paint ──────────────────────────────────────────────────────── */
  const painted = useRef(false);
  useEffect(() => {
    if (painted.current || !layout) return;
    painted.current = true;
    onFirstPaint?.();
  }, [layout, onFirstPaint]);

  /* ── Render ───────────────────────────────────────────────────────────── */

  const shownLeft = turn ? turn.underLeft : leftOf(index);
  const shownRight = turn ? turn.underRight : rightOf(index);

  const canBack = index > 0;
  const canForward = index < lastIndex;

  return (
    <div
      ref={stageRef}
      className={cn(
        "pdf-stage-surface",
        zoomed ? "pdf-stage-zoomed" : "pdf-stage-fit"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={onDoubleClick}
      data-tone={tone}
    >
      {layout && (
        <div
          className="pdf-book"
          style={{
            width: layout.bookW,
            height: layout.bookH,
            // The vanishing point sits above the spine, so both halves are
            // seen from the same place a reader's eyes would be.
            perspective: `${Math.max(layout.bookW * 1.9, 1400)}px`,
            perspectiveOrigin: "50% 42%",
          }}
        >
          {spreadMode && (
            <div className="pdf-slot pdf-slot-left" style={{ width: layout.pageW }}>
              {shownLeft ? (
                <PageFace
                  book={book}
                  pageNumber={shownLeft}
                  width={layout.pageW}
                  height={layout.pageH}
                  tone={tone}
                  selectable={selectable}
                  litLinks={litLinks}
                  highlights={highlights?.get(shownLeft)}
                  activeHighlight={
                    activeHighlight?.page === shownLeft ? activeHighlight.rect : null
                  }
                  onNavigate={goToPage}
                />
              ) : (
                <div className="pdf-slot-empty" style={{ height: layout.pageH }} aria-hidden />
              )}
              <div ref={leftShadeRef} className="pdf-cast pdf-cast-left" style={{ opacity: 0 }} aria-hidden />
            </div>
          )}

          <div
            className={cn("pdf-slot", spreadMode ? "pdf-slot-right" : "pdf-slot-only")}
            style={{ width: layout.pageW }}
          >
            {shownRight ? (
              <PageFace
                book={book}
                pageNumber={shownRight}
                width={layout.pageW}
                height={layout.pageH}
                tone={tone}
                selectable={selectable}
                litLinks={litLinks}
                highlights={highlights?.get(shownRight)}
                activeHighlight={
                  activeHighlight?.page === shownRight ? activeHighlight.rect : null
                }
                onNavigate={goToPage}
              />
            ) : (
              <div className="pdf-slot-empty" style={{ height: layout.pageH }} aria-hidden />
            )}
            <div ref={rightShadeRef} className="pdf-cast pdf-cast-right" style={{ opacity: 0 }} aria-hidden />
          </div>

          {/* The binding. Only meaningful when two pages meet at it. */}
          {spreadMode && <div className="pdf-gutter" aria-hidden />}

          {turn && (
            <div
              className="pdf-leaf-holder"
              style={{
                width: layout.pageW,
                height: layout.pageH,
                left: spreadMode ? layout.pageW : 0,
              }}
            >
              <TurningSheet
                key={turn.key}
                ref={leafRef}
                book={book}
                front={turn.front}
                back={turn.back}
                width={layout.pageW}
                segments={reducedMotion ? 1 : 9}
                initial={turn.direction === 1 ? 0 : 1}
              />
            </div>
          )}

          {/* The corner a reader instinctively reaches for. Hover lifts it;
              clicking it turns the page, the same as the arrows do. */}
          {!zoomed && canForward && (
            <button
              type="button"
              className="pdf-corner pdf-corner-next"
              onClick={() => startTurn(1)}
              tabIndex={-1}
              aria-hidden
            />
          )}
          {!zoomed && canBack && (
            <button
              type="button"
              className="pdf-corner pdf-corner-prev"
              onClick={() => startTurn(-1)}
              tabIndex={-1}
              aria-hidden
            />
          )}
        </div>
      )}
    </div>
  );
});

/**
 * The sheet in the air, with its two faces resolved from the document.
 *
 * Whatever raster is already in memory is used immediately so the turn starts
 * on the frame it was asked for; if the face coming down has not been drawn
 * yet it arrives a moment later and simply appears, because the leaf's
 * rotation lives in the DOM rather than in a prop and a re-render cannot
 * disturb a sheet already in flight.
 */
const TurningSheet = forwardRef<
  LeafHandle,
  {
    book: PdfBook;
    front: number | null;
    back: number | null;
    width: number;
    segments: number;
    initial: number;
  }
>(function TurningSheet({ book, front, back, width, segments, initial }, ref) {
  const [faces, setFaces] = useState(() => ({
    front: front ? (book.peekPage(front)?.url ?? null) : null,
    back: back ? (book.peekPage(back)?.url ?? null) : null,
  }));

  useEffect(() => {
    let cancelled = false;
    const resolve = async (pageNumber: number | null, side: "front" | "back") => {
      if (!pageNumber) return;
      const image = await book.getPage(pageNumber, width);
      if (cancelled || !image) return;
      setFaces((previous) =>
        previous[side] === image.url ? previous : { ...previous, [side]: image.url }
      );
    };
    void resolve(front, "front");
    void resolve(back, "back");
    return () => {
      cancelled = true;
    };
  }, [book, front, back, width]);

  return (
    <BookLeaf
      ref={ref}
      front={faces.front}
      back={faces.back}
      segments={segments}
      initial={initial}
    />
  );
});
