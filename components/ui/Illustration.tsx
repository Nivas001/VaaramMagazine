import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ILLUSTRATIONS
 *
 *  Small line drawings used across the site wherever a picture explains
 *  something faster than a sentence. Three rules hold them together:
 *
 *   · Every one is inline SVG on a 120 × 96 field, drawn with a 2px stroke.
 *     Nothing to download, nothing to lay out twice, no CLS.
 *   · Colour comes only from `rgb(var(--label))` for the accent strokes and
 *     `currentColor` for the structure, so a drawing inherits the theme it
 *     lands in — paper, dark, or the deep wine bands — with no variants.
 *   · They describe what Vaaram actually does: a page, a stack of weeks, a
 *     phone with an edition open. Nothing decorative-for-its-own-sake.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type Props = { className?: string };

const FIELD = "0 0 120 96";

function Frame({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox={FIELD}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={cn("w-full text-[rgb(var(--text-faint))]", className)}
    >
      {children}
    </svg>
  );
}

/** A magazine spread — what an advertisement is laid out onto. */
export function SpreadIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="12" y="14" width="45" height="68" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="63" y="14" width="45" height="68" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M60 12v72" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
      <rect
        x="69"
        y="21"
        width="33"
        height="22"
        rx="1.5"
        fill="rgb(var(--label))"
        opacity="0.16"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      {[24, 32, 40, 48, 56, 64, 72].map((y) => (
        <path key={y} d={`M19 ${y}h31`} stroke="currentColor" strokeWidth="2" opacity="0.5" />
      ))}
      {[51, 59, 67, 75].map((y) => (
        <path key={y} d={`M69 ${y}h${y === 75 ? 20 : 33}`} stroke="currentColor" strokeWidth="2" opacity="0.5" />
      ))}
    </Frame>
  );
}

/** A stack of weekly editions — the archive, and the reason it keeps growing. */
export function StackIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={20 + i * 6}
          y={20 + i * 12}
          width="66"
          height="26"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
          opacity={0.4 + i * 0.3}
        />
      ))}
      <path d="M32 33h20M32 45h26M32 57h22" stroke="rgb(var(--label))" strokeWidth="2" />
      <path d="M92 20v56" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" opacity="0.6" />
      <path d="M88 76l4 4 4-4" stroke="currentColor" strokeWidth="2" opacity="0.6" />
    </Frame>
  );
}

/** A phone with an edition open on it — how most readers actually read. */
export function PhoneIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="40" y="8" width="40" height="80" rx="6" stroke="currentColor" strokeWidth="2" />
      <path d="M53 15h14" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <rect
        x="46"
        y="23"
        width="28"
        height="18"
        rx="1.5"
        fill="rgb(var(--label))"
        opacity="0.16"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      <path d="M46 48h28M46 55h20M46 62h28M46 69h16" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <path d="M22 34c-6 6-6 16 0 22M30 40c-3 3-3 7 0 10" stroke="rgb(var(--label))" strokeWidth="2" />
      <path d="M98 34c6 6 6 16 0 22M90 40c3 3 3 7 0 10" stroke="rgb(var(--label))" strokeWidth="2" />
    </Frame>
  );
}

/** A conversation — the call or message an advertisement is meant to produce. */
export function ConnectIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path
        d="M14 22h52a4 4 0 014 4v24a4 4 0 01-4 4H36l-14 12V54h-8a4 4 0 01-4-4V26a4 4 0 014-4z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M26 34h28M26 43h18" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <path
        d="M78 40h26a4 4 0 014 4v18a4 4 0 01-4 4h-4v10L88 66h-10a4 4 0 01-4-4V44a4 4 0 014-4z"
        fill="rgb(var(--label))"
        opacity="0.14"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      <path d="M84 50h14M84 58h9" stroke="rgb(var(--label))" strokeWidth="2" />
    </Frame>
  );
}

/** Seven days, one of them marked — the weekly rhythm, drawn. */
export function WeekIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="10" y="18" width="100" height="62" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10 34h100" stroke="currentColor" strokeWidth="2" />
      <path d="M32 12v10M88 12v10" stroke="currentColor" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle
          key={i}
          cx={20 + i * 13.5}
          cy={46}
          r="3.5"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
        />
      ))}
      <circle cx="20" cy="46" r="6" fill="rgb(var(--label))" opacity="0.18" />
      <circle cx="20" cy="46" r="6" stroke="rgb(var(--label))" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle
          key={i}
          cx={20 + i * 13.5}
          cy={66}
          r="3.5"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.35"
        />
      ))}
    </Frame>
  );
}

/** A neighbourhood — the local ground the whole publication stands on. */
export function LocalIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <path d="M8 82h104" stroke="currentColor" strokeWidth="2" />
      <path d="M18 82V52l14-10 14 10v30" stroke="currentColor" strokeWidth="2" />
      <path d="M28 82V66h8v16" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <path d="M54 82V38h24v44" stroke="currentColor" strokeWidth="2" />
      <path d="M60 48h5M69 48h5M60 58h5M69 58h5M60 68h5M69 68h5" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path d="M86 82V56h18v26" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <path
        d="M66 12c-5 0-9 4-9 9 0 6.6 9 15 9 15s9-8.4 9-15c0-5-4-9-9-9z"
        fill="rgb(var(--label))"
        opacity="0.16"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      <circle cx="66" cy="21" r="3" stroke="rgb(var(--label))" strokeWidth="2" />
    </Frame>
  );
}

/** A proof going back and forth before an advertisement runs. */
export function ProofIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="14" y="12" width="52" height="66" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M24 26h32M24 35h32M24 44h20" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <rect
        x="24"
        y="52"
        width="32"
        height="16"
        rx="1.5"
        fill="rgb(var(--label))"
        opacity="0.16"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      <path d="M74 30h30M74 30l-6-6M74 30l-6 6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <path d="M104 58H74M104 58l6-6M104 58l6 6" stroke="rgb(var(--label))" strokeWidth="2" />
      <path d="M84 74l6 6 12-14" stroke="rgb(var(--label))" strokeWidth="2" />
    </Frame>
  );
}

/** A magnifying glass over a listing — a reader finding what they came for. */
export function SearchIllustration({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="12" y="14" width="72" height="68" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M22 28h34M22 38h52M22 48h44M22 58h52M22 68h30" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle
        cx="76"
        cy="44"
        r="24"
        fill="rgb(var(--surface))"
        stroke="rgb(var(--label))"
        strokeWidth="2"
      />
      <path d="M94 62l14 14" stroke="rgb(var(--label))" strokeWidth="2" />
      <path d="M64 38h24M64 48h16" stroke="rgb(var(--label))" strokeWidth="2" opacity="0.75" />
    </Frame>
  );
}
