import { cn } from "@/lib/utils";

/**
 * The drawn version of the same story, shown on phones, low-powered devices,
 * where WebGL is unavailable, and whenever reduced motion is requested.
 *
 * It is a storyboard rather than an apology: four composed frames carrying the
 * identical narrative — scattered advertisements, sorted, laid into pages,
 * bound into an edition.
 */

const FRAMES = [
  {
    step: "01",
    title: "Advertisements arrive",
    body: "A shop, a landlord, a tradesperson, an employer — each with something to say.",
  },
  {
    step: "02",
    title: "We gather and sort them",
    body: "Laid out, checked, and grouped into the section a reader would look for.",
  },
  {
    step: "03",
    title: "They become pages",
    body: "Sorted advertisements are set into the pages of the week's edition.",
  },
  {
    step: "04",
    title: "The edition is published",
    body: "The pages become one magazine, online the same week and free to open.",
  },
];

/** A miniature advertisement, drawn the same way as the ones in the scene. */
function Card({ className, tone = "paper" }: { className?: string; tone?: "paper" | "ink" | "wine" }) {
  const tones = {
    paper: "bg-warm-100",
    ink: "bg-warm-800",
    wine: "bg-wine",
  } as const;

  const rule = {
    paper: "bg-warm-400",
    ink: "bg-warm-500",
    wine: "bg-white/70",
  } as const;

  return (
    <div
      className={cn(
        "flex aspect-[3/4] flex-col gap-1 rounded-[2px] p-1.5 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)]",
        tones[tone],
        className
      )}
      aria-hidden
    >
      <span className={cn("h-1 w-1/2 rounded-full", rule[tone])} />
      <span className={cn("h-0.5 w-4/5 rounded-full opacity-60", rule[tone])} />
      <span className={cn("mt-auto h-1/3 w-full rounded-[1px] opacity-25", rule[tone])} />
    </div>
  );
}

export function SceneFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {FRAMES.map((frame, i) => (
          <li key={frame.step}>
            {/* Each frame's illustration shows the cards a stage further on. */}
            <div className="relative flex h-40 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-4">
              {i === 0 && (
                <div className="relative size-full">
                  <Card className="absolute left-[6%] top-[14%] w-[26%] -rotate-12" tone="paper" />
                  <Card className="absolute left-[38%] top-[4%] w-[26%] rotate-6" tone="wine" />
                  <Card className="absolute left-[68%] top-[26%] w-[26%] -rotate-3" tone="ink" />
                </div>
              )}
              {i === 1 && (
                <div className="flex w-full items-end justify-center gap-2">
                  <Card className="w-[20%] -rotate-3" tone="paper" />
                  <Card className="w-[20%]" tone="wine" />
                  <Card className="w-[20%] rotate-2" tone="ink" />
                  <Card className="w-[20%] rotate-6" tone="paper" />
                </div>
              )}
              {i === 2 && (
                <div className="grid w-full grid-cols-4 gap-1.5">
                  <Card tone="paper" />
                  <Card tone="wine" />
                  <Card tone="paper" />
                  <Card tone="ink" />
                  <Card tone="ink" />
                  <Card tone="paper" />
                  <Card tone="paper" />
                  <Card tone="wine" />
                </div>
              )}
              {i === 3 && (
                <div className="relative h-full w-[30%]">
                  <div className="page-stack absolute inset-y-1 left-1 right-[-6px]" />
                  <div className="page-stock absolute inset-0 flex flex-col justify-between bg-warm-950 p-2">
                    <span className="font-display text-[13px] leading-none text-warm-50">
                      Vaaram
                    </span>
                    <span className="h-px w-full bg-wine" />
                  </div>
                </div>
              )}
            </div>

            <p className="label-eyebrow mt-6 text-gold-soft">{frame.step}</p>
            <h3 className="mt-3 font-display text-xl tracking-[-0.02em] text-warm-50">
              {frame.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-warm-300">{frame.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
