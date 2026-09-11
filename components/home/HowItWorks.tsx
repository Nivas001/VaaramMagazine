import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/ui/Section";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import {
  ProofIllustration,
  SpreadIllustration,
  ConnectIllustration,
} from "@/components/ui/Illustration";

/**
 * The whole business in three pictures.
 *
 * The About page carries the full five-step account. This is the short form a
 * home page can afford: what a business sends, what we do with it, and what
 * comes back. Each step is drawn rather than iconified, because an icon says
 * "step" and a drawing says what the step actually is.
 */
const STEPS = [
  {
    title: "Send us your advertisement",
    body: "A business, a service, a property, a vacancy or an offer — in whatever shape you already have it.",
    Art: ProofIllustration,
  },
  {
    title: "We lay it out and proof it",
    body: "We set it, place it in the right section and send it back for you to approve before anything is printed.",
    Art: SpreadIllustration,
  },
  {
    title: "Readers call you",
    body: "It runs in the week's edition, and the people already looking for what you offer come and find it.",
    Art: ConnectIllustration,
  },
];

export function HowItWorks() {
  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="max-w-xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="display-lg mt-5">
            From your advertisement to their phone call.
          </h2>
        </div>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))] underline decoration-[rgb(var(--hairline))] underline-offset-[6px] transition-colors hover:text-[rgb(var(--accent-text))] hover:decoration-[rgb(var(--accent))]"
        >
          The full process
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Reveal>

      <RevealGroup as="ol" className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <RevealItem as="li" key={step.title} className="flex flex-col">
            <div className="card-quiet flex aspect-[5/3] items-center justify-center px-8 py-6">
              <step.Art className="max-h-full w-full max-w-[190px]" />
            </div>

            <p className="label-eyebrow mt-6 flex items-center gap-2.5 text-[rgb(var(--label))]">
              <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-px w-5 bg-current/50" aria-hidden />
              {["You", "We", "They"][i]}
            </p>

            <h3 className="mt-3 font-display text-[25px] leading-tight tracking-[-0.025em]">
              {step.title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
              {step.body}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.15}>
        <p className="mt-12 border-t border-[rgb(var(--hairline))] pt-6 text-[15px] text-[rgb(var(--text-muted))]">
          The cycle runs once a week. Get your advertisement approved in good time and
          it goes into that week&apos;s edition.
        </p>
      </Reveal>
    </div>
  );
}
