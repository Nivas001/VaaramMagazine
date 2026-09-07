import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial card container with clean borders and subtle elevation.
 */
export function BentoCard({
  children,
  className,
  glow: _glow,
  interactive = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  glow?: "violet" | "cyan" | "fuchsia" | "amber" | "emerald" | "none";
  interactive?: boolean;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={cn(
        "bento relative",
        interactive && "bento-hover",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** Channel 199 overline label used above headlines. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121212] px-3.5 py-1.5",
        "font-display text-xs tracking-widest text-[#b89028] dark:text-[#d2ac47] uppercase",
        className
      )}
    >
      <span className="size-1.5 bg-[#cd2129] shrink-0" />
      {children}
    </span>
  );
}

/** Consistent section wrapper: max width, vertical rhythm, horizontal padding. */
export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-wide text-neutral-950 dark:text-white">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 font-sans text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg">
          {lead}
        </p>
      )}
    </div>
  );
}
