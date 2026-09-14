import type { AdBanner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AdRotatorStack } from "./AdRotator";

/**
 * The advertising that frames the top of the home page.
 *
 * Three slots, arranged the way an ad-funded publication arranges them: a
 * leaderboard across the top, a column of tall towers down one side of the
 * headline and a column of cards down the other. Every frame rotates, in the
 * running order set in the admin, for as long as each booking asks for.
 *
 * ── Why the same banners are rendered twice ───────────────────────────────
 * A wide screen gets the standing rails; anything narrower gets the compact
 * arrangement at the foot of the hero. Both are in the markup and a breakpoint
 * decides which has a box. That costs nothing and can never double count: an
 * element with `display: none` never intersects the viewport, so its lazily
 * loaded artwork is never fetched, its rotation never advances and its
 * impressions are never recorded. The rule that keeps this true is that hero
 * artwork must stay lazy — see AdRotator.
 */

/** The caption every paid frame carries. Rendered once per group, not per ad. */
function Caption({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "label-eyebrow mb-2.5 text-[10px] text-[rgb(var(--text-faint))]",
        className
      )}
    >
      Advertisement
    </p>
  );
}

/** The wide strip across the very top of the page. */
export function HeroLeaderboard({
  banners,
  className,
}: {
  banners: AdBanner[];
  className?: string;
}) {
  if (banners.length === 0) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement="home_top"
      className={cn("min-w-0", className)}
    >
      <Caption className="text-center" />
      {/* Held to a billboard width rather than run edge to edge. The strip is
          a fixed 11:2, so a frame stretched across a wide desktop would stand
          three hundred pixels tall and push the week's edition off the screen
          entirely — the one thing the reader actually came for. */}
      <AdRotatorStack
        banners={banners}
        format="strip"
        slots={1}
        className="mx-auto w-full max-w-[900px] 2xl:max-w-[1100px]"
      />
    </aside>
  );
}

/**
 * The towers down the left of the headline.
 *
 * Two frames rather than one: a tower is half as wide as it is tall, so a
 * single one leaves most of a hero-height column empty, and two fill it while
 * doubling the inventory. They are dealt round-robin, so the first two in the
 * running order are the two on screen when the page opens.
 *
 * The `<aside>` itself is never given a display class here — the caller
 * decides that (`hidden xl:flex` in Hero.tsx), so this component only ever
 * adds `flex-col`, never a competing `flex`/`hidden` of its own. Once it has
 * a height (Hero.tsx stretches it to match the leaderboard-plus-content
 * column beside it), the rotator is told to fill whatever is left under the
 * caption and spread its frames across that with `justify-between` — so two
 * towers run the full height of the rail instead of huddling in the middle
 * of it.
 */
export function HeroTowers({
  banners,
  slots = 2,
  className,
}: {
  banners: AdBanner[];
  slots?: number;
  className?: string;
}) {
  if (banners.length === 0) return null;

  return (
    <aside
      aria-label={banners.length > 1 ? "Advertisements" : "Advertisement"}
      data-ad-placement="hero_left"
      className={cn("min-w-0 flex-col", className)}
    >
      <Caption />
      <AdRotatorStack
        banners={banners}
        format="skyscraper"
        slots={slots}
        gap="gap-4"
        className="min-h-0 flex-1 justify-between"
      />
    </aside>
  );
}

/**
 * The stack of cards down the right of the headline.
 *
 * Stretched and spread the same way as the towers opposite — see the note on
 * HeroTowers for why the display class lives with the caller and why the
 * rotator carries `flex-1 justify-between` rather than a plain stack.
 */
export function HeroCards({
  banners,
  slots = 4,
  className,
}: {
  banners: AdBanner[];
  slots?: number;
  className?: string;
}) {
  if (banners.length === 0) return null;

  return (
    <aside
      aria-label={banners.length > 1 ? "Advertisements" : "Advertisement"}
      data-ad-placement="hero_right"
      className={cn("min-w-0 flex-col", className)}
    >
      <Caption />
      <AdRotatorStack
        banners={banners}
        format="card"
        slots={slots}
        gap="gap-4"
        className="min-h-0 flex-1 justify-between"
      />
    </aside>
  );
}

/**
 * The same two side slots, folded into the foot of the hero on anything too
 * narrow to stand them beside the words.
 *
 * It keeps the shape of the wide layout — tower on the left, cards on the
 * right — so a reader moving between a phone and a desktop sees the same page,
 * and an advertiser checking their own booking finds it where they expect.
 * The tower is held to a third of the width so the block stays about as tall
 * as the cards beside it rather than running away down the screen.
 */
export function HeroAdsCompact({
  towers,
  cards,
  className,
}: {
  towers: AdBanner[];
  cards: AdBanner[];
  className?: string;
}) {
  if (towers.length === 0 && cards.length === 0) return null;

  return (
    <aside
      aria-label="Advertisements"
      data-ad-hero-compact
      className={cn("min-w-0", className)}
    >
      <Caption className="text-center" />

      <div className="flex items-start gap-3 sm:gap-4">
        {/* The two column widths below are not taste, they are arithmetic. A
            tower is 1:2 and a card 2:1, so for the tower to finish level with
            the cards beside it the row has to be split a third / two thirds
            against one column of two cards, and a fifth / four fifths against
            two columns of four. Anything else leaves one side hanging below
            the other. */}
        {towers.length > 0 && (
          <div className="w-[34%] max-w-[280px] shrink-0 sm:w-[20%]">
            <AdRotatorStack
              banners={towers}
              format="skyscraper"
              slots={1}
              controls="none"
            />
          </div>
        )}

        {cards.length > 0 && (
          <div className="min-w-0 flex-1">
            {/* A phone has room for two frames beside a tower; a tablet for
                four in two columns. Only one of these ever has a box. */}
            <AdRotatorStack
              banners={cards}
              format="card"
              slots={2}
              gap="gap-3"
              controls="none"
              className="sm:hidden"
            />
            <AdRotatorStack
              banners={cards}
              format="card"
              slots={4}
              gap="gap-4"
              controls="none"
              className="hidden sm:grid sm:grid-cols-2"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
