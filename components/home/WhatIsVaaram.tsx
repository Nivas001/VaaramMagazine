import { siteConfig } from "@/site.config";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SearchIllustration } from "@/components/ui/Illustration";

/**
 * What the publication actually is, in as few words as it can be said.
 *
 * The categories are a typographic index rather than a wall of cards — a
 * magazine's contents page, which is exactly what this is. The drawing beside
 * the copy shows the one thing the words cannot: a reader with the page open,
 * looking for something.
 */
export function WhatIsVaaram() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
      <Reveal>
        <Eyebrow>What Vaaram is</Eyebrow>
        <h2 className="display-lg mt-5 max-w-md">
          Your weekly destination for discovering local businesses, services and
          opportunities.
        </h2>
        <p className="lead mt-6 max-w-md">
          One edition, every {siteConfig.publishDayLabel}. Everything inside it is an
          advertisement — which is the point. People open Vaaram because they are
          looking for something, and what they find is a business ready to hear from
          them.
        </p>

        <div className="mt-10 hidden max-w-sm border-t border-[rgb(var(--hairline))] pt-9 lg:block">
          <SearchIllustration className="max-w-[300px]" />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="label-eyebrow text-[rgb(var(--text-faint))]">Inside every edition</p>

        <RevealGroup as="ul" className="mt-6 border-t border-[rgb(var(--hairline))]">
          {siteConfig.categories.map((category, i) => (
            <RevealItem
              as="li"
              key={category.name}
              className="group flex items-baseline gap-5 border-b border-[rgb(var(--hairline))] py-5 sm:gap-8 sm:py-6"
            >
              <span
                className="w-6 shrink-0 font-display text-sm text-[rgb(var(--text-faint))] tabular-nums"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl tracking-[-0.02em] transition-colors group-hover:text-[rgb(var(--accent-text))] sm:text-[26px]">
                  {category.name}
                </span>
                <span className="mt-1.5 block text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                  {category.blurb}
                </span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </Reveal>
    </div>
  );
}
