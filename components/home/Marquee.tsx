import { siteConfig } from "@/site.config";

/** Clean editorial ticker of publication categories. */
export function CategoryMarquee() {
  const items = [...siteConfig.categories, ...siteConfig.categories, ...siteConfig.categories];

  return (
    <div
      className="relative flex overflow-hidden border-y border-neutral-900 bg-neutral-950 py-3"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
      aria-hidden="true"
    >
      <div className="animate-marquee flex shrink-0 items-center gap-4 pr-4">
        {items.map((category, i) => (
          <span
            key={`${category}-${i}`}
            className="flex items-center gap-2.5 whitespace-nowrap border border-neutral-800 bg-[#0d0d0d] px-4 py-1.5 font-display text-xs tracking-widest text-neutral-200 uppercase hover:border-[#cd2129] transition-colors"
          >
            <span className="size-1.5 bg-[#cd2129]" />
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}
