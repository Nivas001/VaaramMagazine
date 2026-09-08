import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/**
 * Shows an advertiser what a page of Vaaram looks like, and where their
 * advertisement sits on it.
 *
 * The specimens are drawn rather than photographed, and they name no business:
 * inventing a plausible-looking advertiser would read as a fake testimonial.
 * What they show instead is the real thing on offer — the formats a page is
 * sold in, at their true relative sizes.
 */

const FORMATS = [
  {
    name: "Full page",
    detail: "A whole page to yourself",
    span: "col-span-2 row-span-2",
    lines: 5,
    featured: true,
  },
  { name: "Half page", detail: "Across the width", span: "col-span-2", lines: 3 },
  { name: "Quarter page", detail: "A strong block", span: "", lines: 3 },
  { name: "Eighth page", detail: "Compact and clear", span: "", lines: 2 },
  { name: "Classified", detail: "A few lines of text", span: "col-span-2", lines: 2 },
];

export function AdvertiseShowcase() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-20">
      {/* ── The specimen page ──────────────────────────────────────────── */}
      <Reveal className="order-2 lg:order-1">
        <div
          className="page-stock mx-auto w-full max-w-md bg-white p-5 sm:p-7"
          // A real page, so it keeps the proportions of the printed edition.
          style={{ aspectRatio: "3 / 4" }}
          aria-hidden
        >
          <div className="flex h-full flex-col">
            <div className="flex items-baseline justify-between border-b border-warm-200 pb-3">
              <span className="font-display text-lg leading-none tracking-[-0.03em] text-warm-950">
                Vaaram
              </span>
              <span className="label-eyebrow text-[9px] text-warm-400">Services</span>
            </div>

            <div className="mt-4 grid flex-1 auto-rows-fr grid-cols-4 gap-2.5">
              {FORMATS.map((format) => (
                <div
                  key={format.name}
                  className={cn(
                    "flex flex-col justify-between rounded-[3px] p-2.5",
                    format.featured
                      ? "bg-ember text-white"
                      : "bg-warm-100 text-warm-700",
                    format.span
                  )}
                >
                  <div className="space-y-1.5">
                    {Array.from({ length: format.lines }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-full",
                          i === 0 ? "h-1.5" : "h-1",
                          format.featured ? "bg-white/85" : "bg-warm-300"
                        )}
                        style={{ width: `${i === 0 ? 62 : 88 - i * 13}%` }}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      "label-eyebrow mt-2 text-[8px]",
                      format.featured ? "text-white/90" : "text-warm-500"
                    )}
                  >
                    {format.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-warm-200 pt-3">
              <span className="label-eyebrow text-[8px] text-warm-400">Issue 204</span>
              <span className="label-eyebrow text-[8px] text-ember">vaaram.ca</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── The offer ──────────────────────────────────────────────────── */}
      <Reveal delay={0.1} className="order-1 lg:order-2">
        <Eyebrow>Advertise</Eyebrow>
        <h2 className="display-lg mt-5 max-w-md">
          This is where your advertisement gets discovered.
        </h2>
        <p className="lead mt-6 max-w-md">
          A page of Vaaram is sold in five sizes, from a few classified lines to the
          whole page. We lay your advertisement out, send you a proof, and it runs in
          the next edition.
        </p>

        <ul className="mt-8 space-y-px">
          {FORMATS.map((format) => (
            <li
              key={format.name}
              className="flex items-baseline justify-between gap-6 border-b border-[rgb(var(--hairline))] py-3.5"
            >
              <span className="text-[15px] font-semibold text-[rgb(var(--text))]">
                {format.name}
              </span>
              <span className="text-right text-sm text-[rgb(var(--text-muted))]">
                {format.detail}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="mt-9 inline-flex h-[52px] items-center gap-2.5 rounded-full bg-[rgb(var(--accent))] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-ember-strong"
        >
          Talk to us about advertising
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Reveal>
    </div>
  );
}
