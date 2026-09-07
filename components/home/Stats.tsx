import { siteConfig } from "@/site.config";
import { Counter } from "@/components/ui/Counter";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

export function Stats() {
  return (
    <RevealGroup className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4">
      {siteConfig.stats.map((stat) => (
        <RevealItem key={stat.label}>
          <div className="group relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 text-center sm:p-8 shadow-xs hover:border-[#cd2129] hover:shadow-md transition-all">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-neutral-200 dark:bg-neutral-800 group-hover:bg-[#cd2129] transition-colors" />
            <p className="font-display text-4xl tracking-wider text-neutral-900 dark:text-white group-hover:text-[#cd2129] transition-colors sm:text-5xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 font-sans text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              {stat.label}
            </p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
