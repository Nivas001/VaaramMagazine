"use client";

import { createContext, useContext, type ReactNode } from "react";
import { placementSpec, type AdBanner, type BannerPlacement } from "@/lib/types";
import type { SlotFill } from "@/lib/banner-status";
import type { SitePageKey } from "@/lib/placement-guide";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE SITE, DRAWN SMALL
 *
 *  A placement value like "home_feature" means nothing to the person selling
 *  it. A picture of the home page with that one block lit up means everything,
 *  and it answers the two questions the old screen could not:
 *
 *    · where on the website does this advertisement actually appear?
 *    · which spots are still free?
 *
 *  So every page of the public site is redrawn here as a small diagram, at
 *  roughly the proportions a reader sees, with the advertisement slots as real
 *  boxes among the headline, the cover and the text. The boxes are buttons:
 *  clicking one opens that slot. In preview mode the same diagram renders the
 *  booked artwork inside its frame, so an admin can see the advertisement in
 *  position before anybody else does.
 *
 *  These are deliberately diagrams and not an iframe of the live site. An
 *  iframe would be truthful and useless — at a sixth of the size nothing in it
 *  can be read, it costs a full page load per slot, and it cannot show an
 *  *empty* slot at all, which is the thing an administrator most needs to see.
 * ─────────────────────────────────────────────────────────────────────────────
 */

type WireframeContextValue = {
  fills: Partial<Record<BannerPlacement, SlotFill>>;
  selected?: BannerPlacement | null;
  onSelect?: (placement: BannerPlacement) => void;
  /** Draw the booked artwork inside each frame instead of a count. */
  showArtwork?: boolean;
  /** Everything except this placement is greyed back. */
  focus?: BannerPlacement | null;
};

const WireframeContext = createContext<WireframeContextValue>({ fills: {} });

/* ── The furniture a page is drawn from ──────────────────────────────────── */

function Bar({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-5 items-center justify-center rounded-[3px] bg-[rgb(var(--text)/0.07)] text-[8px] font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]",
        className
      )}
    >
      {label}
    </div>
  );
}

/** A block of body copy, drawn as ruled lines. */
function Lines({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full bg-[rgb(var(--text)/0.09)]"
          style={{ width: `${100 - (i % 3) * 16}%` }}
        />
      ))}
    </div>
  );
}

/** A named region of the page that is not for sale — content, not inventory. */
function Content({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-2",
        className
      )}
    >
      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]">
        {label}
      </p>
      {children ?? <Lines />}
    </div>
  );
}

/** The week's cover, the one thing on the home page a reader came for. */
function Cover() {
  return (
    <div className="flex items-center gap-2">
      <div className="aspect-[3/4] w-[42px] shrink-0 rounded-[2px] bg-[rgb(var(--text)/0.16)]" />
      <div className="min-w-0 flex-1">
        <div className="h-2.5 w-4/5 rounded-full bg-[rgb(var(--text)/0.22)]" />
        <div className="mt-1.5 h-2.5 w-3/5 rounded-full bg-[rgb(var(--text)/0.22)]" />
        <Lines count={2} className="mt-2" />
      </div>
    </div>
  );
}

/* ── The slot itself ─────────────────────────────────────────────────────── */

const ASPECT: Record<string, string> = {
  card: "aspect-[2/1]",
  strip: "aspect-[11/2]",
  skyscraper: "aspect-[1/2]",
};

/**
 * One advertisement frame on the diagram.
 *
 * A placement with several frames draws one of these per frame — that is what
 * makes "four cards down the right of the hero" legible as four boxes rather
 * than as the word "four" in a table.
 */
function AdBox({
  placement,
  frameIndex = 0,
  label,
  className,
  /** Stack placements draw a fixed few boxes and say "and the rest". */
  ghost = false,
}: {
  placement: BannerPlacement;
  frameIndex?: number;
  label?: string;
  className?: string;
  ghost?: boolean;
}) {
  const { fills, selected, onSelect, showArtwork, focus } = useContext(WireframeContext);
  const spec = placementSpec(placement);
  const fill = fills[placement];
  const live = fill?.live ?? [];
  const banner: AdBanner | undefined = live[frameIndex % Math.max(live.length, 1)];
  const taken = Boolean(banner);
  const warn = Boolean(fill?.endingSoon.length) && taken;
  const isSelected = selected === placement;
  const dimmed = focus != null && focus !== placement;
  const focused = focus === placement;

  // The count belongs on the first frame only. Repeating "6 booked" inside all
  // four hero frames reads as six advertisements per frame, which is the
  // opposite of what the four boxes are there to show.
  const caption =
    label ??
    (taken ? (frameIndex === 0 && !ghost ? `${live.length} booked` : "") : ghost ? "" : "Free");

  const body = showArtwork && banner ? (
    // Uploaded artwork, served straight from object storage — the same reason
    // the public AdCard bypasses Next's optimiser.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.image_url}
      alt={`${banner.client_name} — ${spec.label}`}
      className="size-full rounded-[2px] object-contain"
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="px-1 text-center text-[8px] font-bold uppercase leading-[1.25] tracking-[0.06em]">
      {caption}
    </span>
  );

  const content = (
    // `w-full` and an aspect ratio, never `size-full`: a <button> is
    // shrink-to-fit, so a box sized from its own contents collapses to the
    // width of its caption — and to nothing at all when the caption is empty.
    <span
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-[3px] border transition-colors",
        ASPECT[spec.format],
        ghost && "opacity-45",
        dimmed && "opacity-40",
        // In focus mode the one slot being talked about is ringed as well as
        // undimmed — on a diagram this dense, a difference in opacity alone is
        // not enough to find it.
        focused && "ring-2 ring-[rgb(var(--accent))] ring-offset-1 ring-offset-[rgb(var(--surface-3))]",
        taken
          ? warn
            ? "border-amber-500/55 bg-amber-500/12 text-amber-700 dark:text-amber-400"
            : "border-[rgb(var(--accent))]/45 bg-[rgb(var(--accent))]/12 text-[rgb(var(--accent-text))]"
          : "border-dashed border-[rgb(var(--text-faint))]/55 bg-[rgb(var(--surface-2))] text-[rgb(var(--text-faint))]",
        isSelected && "ring-2 ring-[rgb(var(--accent))] ring-offset-1 ring-offset-[rgb(var(--surface-3))]"
      )}
    >
      {body}
    </span>
  );

  if (!onSelect) return <div className={cn("w-full min-w-0", className)}>{content}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect(placement)}
      aria-pressed={isSelected}
      title={`${spec.label} — ${fill?.summary ?? "Empty"}`}
      className={cn(
        "block w-full min-w-0 cursor-pointer rounded-[3px] text-left transition-transform hover:scale-[1.03] focus-visible:outline-none",
        className
      )}
    >
      {content}
    </button>
  );
}

/* ── The pages ───────────────────────────────────────────────────────────── */

function HomeWireframe() {
  return (
    <div className="space-y-2">
      <Bar label="Vaaram — navigation" />
      <AdBox placement="home_top" />

      {/* The opening screen: towers left, headline and cover centre, cards right. */}
      <div className="grid grid-cols-[46px_minmax(0,1fr)_62px] gap-2">
        <div className="space-y-2">
          <AdBox placement="hero_left" frameIndex={0} />
          <AdBox placement="hero_left" frameIndex={1} />
        </div>
        <div className="rounded-[4px] border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-2">
          <div className="h-3 w-11/12 rounded-full bg-[rgb(var(--text)/0.24)]" />
          <div className="mt-1.5 h-3 w-7/12 rounded-full bg-[rgb(var(--text)/0.24)]" />
          <div className="mt-2.5">
            <Cover />
          </div>
        </div>
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <AdBox key={i} placement="hero_right" frameIndex={i} />
          ))}
        </div>
      </div>

      <AdBox placement="home_hero" />

      {/* The railed stretch: advertisements down the left, page down the right. */}
      <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2">
        <div className="space-y-1.5">
          <AdBox placement="site_rail" frameIndex={0} label="Side rail" />
          <AdBox placement="site_rail" frameIndex={1} />
          <AdBox placement="site_rail" frameIndex={2} ghost />
        </div>
        <div className="space-y-2">
          <Content label="This week's edition" />
          <Content label="What Vaaram is" />
          <AdBox placement="home_mid" />
        </div>
      </div>

      <Bar label="How it works" className="h-7" />

      <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2">
        <div className="space-y-1.5">
          <AdBox placement="site_rail" frameIndex={3} label="…rail continues" />
          <AdBox placement="site_rail" frameIndex={4} ghost />
        </div>
        <div className="space-y-2">
          <Content label="Advertise with Vaaram" />
          <AdBox placement="home_feature" />
          <Content label="Previous editions" />
          <AdBox placement="home_closing" />
        </div>
      </div>

      <Bar label="Get your business discovered" className="h-7 bg-[rgb(var(--accent))]/22 text-[rgb(var(--accent-text))]" />
      <FooterStrip />
    </div>
  );
}

function ArchiveWireframe() {
  return (
    <div className="space-y-2">
      <Bar label="Vaaram — navigation" />
      <Content label="Every edition, ever" />

      <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2">
        <div className="space-y-1.5">
          <AdBox placement="site_rail" frameIndex={0} label="Side rail" />
          <AdBox placement="site_rail" frameIndex={1} />
          <AdBox placement="site_rail" frameIndex={2} ghost />
        </div>
        <div className="space-y-2">
          <AdBox placement="listing_top" />
          <Content label="Editions 1–8">
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[2px] bg-[rgb(var(--text)/0.14)]" />
              ))}
            </div>
          </Content>
          <AdBox placement="listing_inline" />
          <Content label="Older editions">
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[2px] bg-[rgb(var(--text)/0.14)]" />
              ))}
            </div>
          </Content>
        </div>
      </div>

      <FooterStrip />
    </div>
  );
}

function ReaderWireframe() {
  return (
    <div className="space-y-2">
      <Bar label="Vaaram — navigation" />
      <Content label="Edition title, date, download" />
      <AdBox placement="reader_top" />

      <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2">
        <div className="space-y-1.5">
          <AdBox placement="reader_rail" frameIndex={0} label="Reader rail" />
          <AdBox placement="reader_rail" frameIndex={1} />
          <AdBox placement="reader_rail" frameIndex={2} ghost />
        </div>
        <Content label="The edition, page by page">
          <div className="flex gap-1.5">
            <div className="aspect-[3/4] flex-1 rounded-[2px] bg-[rgb(var(--text)/0.16)]" />
            <div className="aspect-[3/4] flex-1 rounded-[2px] bg-[rgb(var(--text)/0.16)]" />
          </div>
        </Content>
      </div>

      <AdBox placement="reader_below" />
      <Content label="More editions" />
      <FooterStrip />
    </div>
  );
}

/** The footer grid, which is on every page of the site without exception. */
function FooterStrip() {
  return (
    <div className="rounded-[4px] border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-2">
      <p className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[rgb(var(--text-faint))]">
        Above the footer · on every page
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <AdBox key={i} placement="footer" frameIndex={i} label={i === 0 ? "Footer" : undefined} />
        ))}
      </div>
      <Bar label="Contact · links · subscribe" className="mt-2" />
    </div>
  );
}

/**
 * Everything on a phone, where two thirds of readers are.
 *
 * Worth drawing separately rather than describing in a sentence: the side
 * rails do not simply narrow, they are dealt into the page a couple of cards
 * at a time, and the hero's towers and cards leave the sides altogether and
 * gather under the headline. An advertiser being sold "the left rail" is
 * mostly buying that behaviour.
 */
function PhoneWireframe({ page }: { page: SitePageKey }) {
  return (
    <div className="mx-auto w-[168px] rounded-[10px] border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-1.5 shadow-sm">
      <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-[rgb(var(--text)/0.18)]" />
      <div className="space-y-1.5">
        <Bar label="Menu" className="h-4" />
        {page === "home" && (
          <>
            <AdBox placement="home_top" />
            <Content label="Headline">
              <Cover />
            </Content>
            {/* The hero's side slots leave the sides on a phone and gather in
                one block under the headline — a tower against two cards, the
                proportions HeroAdsCompact actually uses. */}
            <div className="flex items-start gap-1.5">
              <div className="w-[34%] shrink-0">
                <AdBox placement="hero_left" frameIndex={0} />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <AdBox placement="hero_right" frameIndex={0} />
                <AdBox placement="hero_right" frameIndex={1} />
              </div>
            </div>
            <AdBox placement="home_hero" />
            <Content label="This week" />
            <AdBox placement="site_rail" frameIndex={0} label="Rail, threaded in" />
            <AdBox placement="site_rail" frameIndex={1} />
            <Content label="What Vaaram is" />
            <AdBox placement="home_mid" />
            <Content label="Advertise with Vaaram" />
            <AdBox placement="home_feature" />
            <Content label="Previous editions" />
            <AdBox placement="home_closing" />
          </>
        )}
        {page === "archive" && (
          <>
            <Content label="Archive" />
            <AdBox placement="listing_top" />
            <Content label="Covers" />
            <AdBox placement="site_rail" frameIndex={0} label="Rail, threaded in" />
            <AdBox placement="listing_inline" />
            <Content label="Older" />
          </>
        )}
        {page === "reader" && (
          <>
            <Content label="Edition" />
            <AdBox placement="reader_top" />
            <Content label="The pages">
              <div className="aspect-[3/4] rounded-[2px] bg-[rgb(var(--text)/0.16)]" />
            </Content>
            <AdBox placement="reader_rail" frameIndex={0} label="Rail, below" />
            <AdBox placement="reader_below" />
          </>
        )}
        {page === "everywhere" && (
          <>
            <Content label="Any page" />
            <AdBox placement="site_rail" frameIndex={0} label="Rail, threaded in" />
            <Content label="…more of the page" />
          </>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <AdBox placement="footer" frameIndex={0} label="Footer" />
          <AdBox placement="footer" frameIndex={1} />
        </div>
        <Bar label="Footer" className="h-4" />
      </div>
    </div>
  );
}

/** Slots that follow the reader everywhere get their own small diagram. */
function EverywhereWireframe() {
  return (
    <div className="space-y-2">
      <Bar label="Any page on the site" />
      <div className="grid grid-cols-[62px_minmax(0,1fr)] gap-2">
        <div className="space-y-1.5">
          <AdBox placement="site_rail" frameIndex={0} label="Side rail" />
          <AdBox placement="site_rail" frameIndex={1} />
          <AdBox placement="site_rail" frameIndex={2} />
          <AdBox placement="site_rail" frameIndex={3} ghost />
        </div>
        <div className="space-y-2">
          <Content label="Whatever the page is about" />
          <Content label="…and the rest of it" />
        </div>
      </div>
      <FooterStrip />
    </div>
  );
}

const PAGES: Record<SitePageKey, () => ReactNode> = {
  home: HomeWireframe,
  archive: ArchiveWireframe,
  reader: ReaderWireframe,
  everywhere: EverywhereWireframe,
};

/**
 * One page of the website, drawn small.
 *
 * `onSelect` makes every advertisement frame a button. Leave it out for a
 * read-only picture — which is what the preview dialog wants.
 */
export function PageWireframe({
  page,
  fills,
  selected,
  onSelect,
  showArtwork = false,
  focus,
  device = "desktop",
  className,
}: {
  page: SitePageKey;
  fills: Partial<Record<BannerPlacement, SlotFill>>;
  selected?: BannerPlacement | null;
  onSelect?: (placement: BannerPlacement) => void;
  showArtwork?: boolean;
  focus?: BannerPlacement | null;
  device?: "desktop" | "phone";
  className?: string;
}) {
  const Page = PAGES[page];

  return (
    <WireframeContext.Provider value={{ fills, selected, onSelect, showArtwork, focus }}>
      <div
        className={cn(
          "rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-3",
          className
        )}
      >
        {device === "phone" ? <PhoneWireframe page={page} /> : <Page />}
      </div>
    </WireframeContext.Provider>
  );
}

/** The key under a diagram, so the colours are never a guess. */
export function WireframeLegend({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[rgb(var(--text-muted))]",
        className
      )}
    >
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] border border-[rgb(var(--accent))]/45 bg-[rgb(var(--accent))]/12" />
        Booked and running
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] border border-amber-500/55 bg-amber-500/12" />
        Ending soon
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-[3px] border border-dashed border-[rgb(var(--text-faint))]/55 bg-[rgb(var(--surface-2))]" />
        Free — available to sell
      </li>
    </ul>
  );
}
