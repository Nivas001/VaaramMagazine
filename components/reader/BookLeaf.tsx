"use client";

import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from "react";

/**
 * One sheet of paper, turning.
 *
 * The obvious way to animate a page turn is to rotate a single flat rectangle
 * about the spine. It reads as a swinging door rather than as paper, because
 * paper bends: the middle of the sheet bows away from the reader while the
 * bound edge and the free edge stay on the arc.
 *
 * So the leaf is built as a hinged chain. It is cut into vertical strips, each
 * nested inside the one before it and hinged at its own left edge, and each
 * rotated a little further than its neighbour. The shape of the bend is one
 * line of maths:
 *
 *     angle(strip i) = 180·p  +  curl · sin(π · (i + ½) / S)
 *     curl           = MAX_CURL · sin(π · p)
 *
 * The first term swings the whole sheet; the second bows it, most at the
 * half-way point and not at all when the sheet is lying flat at either end.
 *
 * ── Why the strips are invisible ───────────────────────────────────────────
 * Two things would otherwise give the seams away, and both are solved the same
 * way — by slicing one continuous image across the strips with
 * `background-size: S×100%` and sliding the background along:
 *
 *  · the **page**, which would repeat on every strip instead of running across
 *    the sheet once;
 *  · the **shading**, which is the subtler of the two. A gradient per strip
 *    paints S dark bands and turns a curved sheet into a folded fan. The
 *    gradient has to span the whole leaf, with each strip showing its own slice
 *    of it, and only the *strength* of that shading varies per strip — from how
 *    far that strip has turned away from the light.
 *
 * ── Why progress is not React state ────────────────────────────────────────
 * A turn is sixty frames of continuous motion and a drag is the reader's own
 * finger. Neither can afford a re-render per frame, so progress is written
 * straight to the DOM. Nothing here reads `transform` back out, and no render
 * path writes one, so a re-render (a page image arriving, say) never disturbs a
 * sheet already in the air.
 */

export type LeafHandle = {
  /** 0 = lying flat on the right. 1 = turned fully onto the left. */
  setProgress: (p: number) => void;
};

/**
 * How far the middle of the sheet bows out of its arc at the half-way point.
 *
 * Small on purpose. Paper barely bends — past about fifteen degrees a chain of
 * flat strips stops reading as a curve and starts reading as a folded fan.
 */
const MAX_CURL = 13;
/** The paper's own colour, seen on the back of a sheet with nothing printed. */
const PAPER = "#f7f4ef";

const SHADE_FRONT = "linear-gradient(to left, rgba(0,0,0,0.85), rgba(0,0,0,0.34) 46%, rgba(0,0,0,0.06))";
const SHADE_BACK = "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.34) 46%, rgba(0,0,0,0.06))";

export const BookLeaf = forwardRef<
  LeafHandle,
  {
    /** The face you see while the sheet is on the right (progress below ½). */
    front: string | null;
    /** The face you see once it has passed the spine. Null for bare paper. */
    back?: string | null;
    /** Strips across the sheet. More is smoother; nine is imperceptible. */
    segments?: number;
    /** Starting progress, so a leaf mounted mid-drag does not flash flat. */
    initial?: number;
  }
>(function BookLeaf({ front, back = null, segments = 9, initial = 0 }, ref) {
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontShadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backShadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progress = useRef(initial);

  const count = Math.max(1, segments);

  const apply = useCallback(
    (p: number) => {
      progress.current = p;
      const swing = 180 * p;
      const curl = MAX_CURL * Math.sin(Math.PI * Math.min(Math.max(p, 0), 1));

      let previous = 0;
      for (let i = 0; i < count; i++) {
        const plane = swing + curl * Math.sin((Math.PI * (i + 0.5)) / count);
        // Each strip is hinged inside the one before it, so what it is given
        // is the *joint* angle — the difference from where its parent left off.
        const joint = plane - previous;
        previous = plane;

        const segment = segmentRefs.current[i];
        if (segment) segment.style.transform = `rotateY(${-joint}deg)`;

        // Light falls off as a face turns away from the reader: none while the
        // sheet lies flat, most when it stands edge-on at the half-way point.
        const shade = Math.abs(Math.sin((plane * Math.PI) / 180));
        const frontShade = frontShadeRefs.current[i];
        if (frontShade) frontShade.style.opacity = String(shade * 0.6);
        const backShade = backShadeRefs.current[i];
        if (backShade) backShade.style.opacity = String(shade * 0.48);
      }
    },
    [count]
  );

  useImperativeHandle(ref, () => ({ setProgress: apply }), [apply]);

  // Placed before the first paint, so a sheet that mounts part-way through a
  // drag appears where the finger already is rather than snapping flat first.
  useLayoutEffect(() => {
    apply(progress.current);
  }, [apply]);

  // The strips are nested, so the tree is built from the outermost strip
  // inwards — each one becomes the child of the strip before it.
  let tree: React.ReactNode = null;
  for (let i = count - 1; i >= 0; i--) {
    const child = tree;
    const index = i;
    // Slice `index` of the sheet, counted from the binding. The back is seen
    // from behind, so its slices run the other way.
    const frontPos = count === 1 ? 0 : (index / (count - 1)) * 100;
    const backPos = count === 1 ? 0 : ((count - 1 - index) / (count - 1)) * 100;
    const slice = { backgroundSize: `${count * 100}% 100%` };

    tree = (
      <div
        key={index}
        ref={(el) => {
          segmentRefs.current[index] = el;
        }}
        className="book-leaf-seg"
        // No `transform` here on purpose: it belongs to the animation, and a
        // re-render must never reach in and reset a sheet that is mid-flight.
        style={
          index === 0 ? { width: `${100 / count}%`, left: 0 } : { width: "100%", left: "100%" }
        }
      >
        <div
          className="book-leaf-face"
          style={{
            ...slice,
            backgroundImage: front ? `url(${front})` : undefined,
            backgroundColor: front ? undefined : PAPER,
            backgroundPosition: `${frontPos}% 0`,
          }}
        >
          <div
            ref={(el) => {
              frontShadeRefs.current[index] = el;
            }}
            className="book-leaf-shade"
            style={{ ...slice, backgroundImage: SHADE_FRONT, backgroundPosition: `${frontPos}% 0`, opacity: 0 }}
          />
        </div>

        <div
          className="book-leaf-face book-leaf-back"
          style={{
            ...slice,
            backgroundImage: back ? `url(${back})` : undefined,
            backgroundColor: back ? undefined : PAPER,
            backgroundPosition: `${backPos}% 0`,
          }}
        >
          <div
            ref={(el) => {
              backShadeRefs.current[index] = el;
            }}
            className="book-leaf-shade"
            style={{ ...slice, backgroundImage: SHADE_BACK, backgroundPosition: `${backPos}% 0`, opacity: 0 }}
          />
        </div>

        {child}
      </div>
    );
  }

  return (
    <div className="book-leaf" aria-hidden>
      {tree}
    </div>
  );
});
