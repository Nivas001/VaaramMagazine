import { Children, type ReactNode } from "react";
import type { AdBanner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdCard } from "./AdCard";
import { AdLabel, HouseAd } from "./AdSlot";

/**
 * The one place the rail's split point lives.
 *
 * The site this was modelled on splits its two columns at 768px. We split at
 * 1024 instead, for two reasons: the whole site is built on a two-step
 * `sm:` → `lg:` ladder and a third layout breakpoint would fracture it, and at
 * 768 the content column is around 480px, which is too narrow for the archive's
 * cover grid and for the page reader.
 *
 * To match that site exactly, change `lg:` to `md:` here — and nowhere else.
 */
export const RAIL_GRID =
  "lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-12 xl:grid-cols-[340px_minmax(0,1fr)]";

/**
 * Advertisements beside the content on a wide screen, threaded through it on a
 * phone.
 *
 * On a wide screen this is the layout the client asked for: a rail of cards
 * down the left, the content on the right, both columns sizing themselves so
 * neither stretches to match the other. The rail can be far longer than the
 * content, in which case the page simply grows — that is how the reference
 * site behaves too.
 *
 * On a phone there is no room for two columns, and stacking the whole rail
 * above the content would put thousands of pixels of advertising in front of a
 * reader before they reach a single word. So the same cards are dealt into the
 * content instead, a couple at a time. Every booked advertisement still
 * renders, in the same order, at full width — and because an impression is
 * only counted once a card has been on screen for a second, threading them
 * through the page means more of them are genuinely seen, not fewer.
 *
 * ── How the two arrangements coexist ──────────────────────────────────────
 * The content is rendered exactly once. Only the advertisements appear twice:
 * as a standing column that is hidden below `lg`, and as small groups dealt
 * between the content blocks that are hidden from `lg` up.
 *
 * That split matters. Rendering the whole subtree twice would mount the page's
 * content components twice over — on the archive that means two copies of the
 * browser, each with its own search box and view state, so a view chosen at
 * one width would be forgotten at another. Advertisements have no state and
 * are cheap to repeat, and repeating them costs nothing at all:
 *
 *   · `hidden` is `display: none`, and a lazily-loaded image inside one is
 *     never fetched — so the copy that is switched off costs no bandwidth.
 *   · An element with no box never intersects the viewport, so the hidden copy
 *     never records an impression. No double counting, and no code to prevent
 *     it.
 *
 * The consequence to remember: rail images must stay lazy. Marking one eager
 * would fetch it in both places and give back the saving.
 *
 * The columns are `items-start`, so neither stretches to match the other —
 * which is what keeps a tall rail from opening gaps down the content.
 */
export function RailLayout({
  banners,
  children,
  everyN = 2,
  groupSize = 2,
  showTail = true,
  interleave: threadThrough = true,
  className,
}: {
  banners: AdBanner[];
  children: ReactNode;
  /** Phones: deal in advertisements after every this many content blocks. */
  everyN?: number;
  /** Phones: how many to deal at a time. */
  groupSize?: number;
  /** Close a long rail with Vaaram's own "book this space" panel. */
  showTail?: boolean;
  /**
   * Whether this component threads the advertisements through the content on a
   * phone.
   *
   * Turn it off where the page's content is a single component that cannot be
   * split into blocks — the archive's browser, for instance — and hand the same
   * banners to that component instead, so it can place them among its own
   * items. Without this they would all bunch at the foot of the page.
   */
  interleave?: boolean;
  className?: string;
}) {
  const blocks = Children.toArray(children);

  // Nothing booked: the content keeps the page to itself rather than sitting
  // beside an empty column.
  if (banners.length === 0) {
    return <div className={className}>{blocks}</div>;
  }

  return (
    <div className={cn(RAIL_GRID, className)}>
      {/* ── Wide screens: the standing rail, on the left ─────────────────── */}
      <aside
        aria-label="Advertisements"
        data-ad-rail
        className="hidden min-w-0 lg:order-1 lg:block"
      >
        <AdLabel plural={banners.length > 1} />
        <div className="flex flex-col gap-5 sm:gap-6">
          {banners.map((banner) => (
            <AdCard key={banner.id} banner={banner} format="card" />
          ))}
          {/* A long rail should close on an invitation rather than on dead
              air below the end of the content. */}
          {showTail && <HouseAd format="card" labelled={false} />}
        </div>
      </aside>

      {/* ── The content, rendered once, with the same advertisements dealt
             between its blocks on anything narrower than lg. ────────────── */}
      <div className="min-w-0 lg:order-2">
        {threadThrough ? thread(blocks, banners, everyN, groupSize) : blocks}
      </div>
    </div>
  );
}

/**
 * Content blocks with groups of advertisements dealt in between them.
 *
 * The groups are sized and spaced from the two counts rather than fixed, so
 * they spread across whatever gaps the page actually has. A fixed interval
 * would thread the first few and then dump the remainder in one block at the
 * foot of the page — which is the wall this whole arrangement exists to avoid.
 *
 * `everyN` and `groupSize` are the shape aimed for; both give way when the
 * page has too few gaps to honour them.
 */
function thread(
  blocks: ReactNode[],
  banners: AdBanner[],
  everyN: number,
  groupSize: number
) {
  // The gaps between blocks. Nothing is placed after the last block, which
  // would be a stack at the foot of the page rather than a thread through it —
  // unless there is only one block, when after it is the only place there is.
  const afterLast = blocks.length <= 1;
  const gaps = Math.max(1, blocks.length - 1);
  const wanted = Math.ceil(banners.length / groupSize);
  const groups = Math.min(wanted, gaps);
  const perGroup = Math.ceil(banners.length / groups);
  const stride = Math.max(1, Math.min(everyN, Math.floor(gaps / groups)));

  const out: ReactNode[] = [];
  let next = 0;
  let placed = 0;

  blocks.forEach((block, i) => {
    out.push(<div key={`block-${i}`}>{block}</div>);

    const isLast = i === blocks.length - 1;
    if ((isLast && !afterLast) || next >= banners.length) return;
    if (placed >= groups) return;
    if ((i + 1) % stride !== 0) return;

    // The final group takes whatever is left, so nothing is dropped.
    const remaining = groups - placed - 1;
    const take = remaining === 0 ? banners.length - next : perGroup;
    const group = banners.slice(next, next + take);
    next += group.length;
    placed += 1;
    out.push(<AdGroup key={`ads-${i}`} banners={group} className="lg:hidden" />);
  });

  return out;
}

/**
 * A short run of advertisements dealt into the content.
 *
 * Exported so a page whose content is one indivisible component can place
 * these among its own items instead — see the archive's cover grid.
 */
export function AdGroup({
  banners,
  className,
}: {
  banners: AdBanner[];
  className?: string;
}) {
  if (banners.length === 0) return null;

  return (
    <aside
      aria-label="Advertisements"
      data-ad-rail-group
      className={cn("my-10 sm:my-12", className)}
    >
      <AdLabel plural={banners.length > 1} />
      <div className="flex flex-col gap-5 sm:gap-6">
        {banners.map((banner) => (
          <AdCard key={banner.id} banner={banner} format="card" />
        ))}
      </div>
    </aside>
  );
}
