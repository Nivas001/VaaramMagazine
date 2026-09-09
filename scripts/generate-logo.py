#!/usr/bin/env python3
"""
─────────────────────────────────────────────────────────────────────────────
 VAARAM — LOGO MARK GENERATOR

 The mark is a bird in flight: two fans of feather blades and a tapered body,
 drawn in the wordmark's deep maroon with the rose gold of its inner feathers.

 Every blade is swept numerically along a Bézier spine, so the outlines stay
 mathematically smooth and the weights can be retuned by changing one number
 here rather than by hand-editing path data.

 Run:  python3 scripts/generate-logo.py
 Writes:
   · public/brand/vaaram-mark.svg   — fixed brand inks (favicon, OG image)
   · components/site/VaaramMark.tsx — the same geometry, themeable in React
─────────────────────────────────────────────────────────────────────────────
"""
import math
from pathlib import Path

WINE, GOLD, PAPER = "#8a1332", "#b07a5c", "#faf8f4"
ROOT = Path(__file__).resolve().parent.parent


def bez(P, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = P
    u = 1 - t
    return (u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
            u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3)


def dbez(P, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = P
    u = 1 - t
    return (3*u*u*(x1-x0) + 6*u*t*(x2-x1) + 3*t*t*(x3-x2),
            3*u*u*(y1-y0) + 6*u*t*(y2-y1) + 3*t*t*(y3-y2))


def ribbon(P, wfun, n=52):
    """A ribbon of varying width swept along a cubic Bézier."""
    left, right = [], []
    for i in range(n + 1):
        t = i / n
        x, y = bez(P, t)
        dx, dy = dbez(P, t)
        length = math.hypot(dx, dy) or 1e-6
        nx, ny = -dy / length, dx / length
        half = wfun(t) / 2
        left.append((x + nx * half, y + ny * half))
        right.append((x - nx * half, y - ny * half))
    return "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in left + right[::-1]) + "Z"


def blade(a, b, bow, wmax, sharp=0.8, n=34):
    """One feather: pointed at both ends, bowed along its length."""
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy) or 1e-6
    nx, ny = -dy / length, dx / length
    spine = (a,
             (ax + dx * .34 + nx * bow, ay + dy * .34 + ny * bow),
             (ax + dx * .68 + nx * bow, ay + dy * .68 + ny * bow),
             b)
    return ribbon(spine, lambda t: wmax * (math.sin(math.pi * t) ** sharp), n=n)


def geometry():
    """(colour-role, path) in painting order. Roles: 'primary' | 'accent'."""
    parts = []
    # Upper wing — three blades sweeping up and back.
    parts.append(("primary", blade((30, 36), (5.5, 12), bow=-5.6, wmax=10.2)))
    parts.append(("accent",  blade((29.5, 34), (15, 4), bow=-4.0, wmax=8.2)))
    parts.append(("primary", blade((29, 31.5), (26.5, 3), bow=-2.4, wmax=6.0)))
    # Lower wing — two blades, balancing the upper set.
    parts.append(("primary", blade((30, 39), (7, 52), bow=3.6, wmax=8.6)))
    parts.append(("accent",  blade((30.5, 41), (16, 59), bow=2.6, wmax=6.4)))
    # Body — chest rising into the neck.
    parts.append(("primary", ribbon(((26, 46), (26, 36), (32, 24), (42.5, 19)),
                                    lambda t: 4 + 8.8 * math.sin(math.pi * min(t * 1.05, 1)) ** 0.55)))
    return parts


HEAD = (44.2, 16.6)
HEAD_R = 7.2
BEAK_TIP = (59.5, 17.2)


def svg_body(primary, accent, eye):
    hx, hy = HEAD
    bx, by = BEAK_TIP
    lines = []
    for role, d in geometry():
        lines.append(f'  <path fill="{primary if role == "primary" else accent}" d="{d}"/>')
    lines.append(f'  <circle cx="{hx}" cy="{hy}" r="{HEAD_R}" fill="{primary}"/>')
    lines.append(
        f'  <path fill="{primary}" d="M{hx + 4.6:.1f} {hy - 3.5:.1f} {bx} {by} {hx + 4.6:.1f} {hy + 3.5:.1f}Z"/>')
    lines.append(f'  <circle cx="{hx + 2.8:.1f}" cy="{hy - 2.2:.1f}" r="1.85" fill="{eye}"/>')
    return lines


def write_svg():
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Vaaram">']
    out += svg_body(WINE, GOLD, PAPER)
    out.append("</svg>")
    path = ROOT / "public/brand/vaaram-mark.svg"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(out) + "\n")
    return path


def write_component():
    body = "\n".join(
        line.replace(f'fill="{WINE}"', 'fill="rgb(var(--mark-primary))"')
            .replace(f'fill="{GOLD}"', 'fill="rgb(var(--mark-accent))"')
            .replace(f'fill="{PAPER}"', 'fill="rgb(var(--mark-eye,var(--surface)))"')
            .replace("  ", "      ", 1)
        for line in svg_body(WINE, GOLD, PAPER)
    )
    source = f'''/**
 * ⚠️  GENERATED FILE — edit scripts/generate-logo.py and re-run it instead.
 *
 * The Vaaram bird mark. Its two inks come from CSS custom properties
 * (--mark-primary and --mark-accent), so the same geometry retints itself for
 * light, dark and the deep wine bands without a second copy of the artwork.
 */
import {{ cn }} from "@/lib/utils";

export function VaaramMark({{
  className,
  title,
}}: {{
  className?: string;
  /** Give this only when the mark stands alone as the link's whole label. */
  title?: string;
}}) {{
  return (
    <svg
      viewBox="0 0 64 64"
      className={{cn("block", className)}}
      role={{title ? "img" : "presentation"}}
      aria-label={{title}}
      aria-hidden={{title ? undefined : true}}
      focusable="false"
    >
{body}
    </svg>
  );
}}
'''
    path = ROOT / "components/site/VaaramMark.tsx"
    path.write_text(source)
    return path


if __name__ == "__main__":
    for written in (write_svg(), write_component()):
        print("wrote", written.relative_to(ROOT))
