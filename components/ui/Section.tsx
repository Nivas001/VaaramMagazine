import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single horizontal rhythm for the whole site. Every page section goes
 * through here so gutters and max widths can never drift apart.
 */
export function Section({
  children,
  className,
  id,
  width = "default",
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  width?: "default" | "wide" | "narrow" | "full";
  as?: "section" | "div" | "article" | "aside";
}) {
  const widths = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-[88rem]",
    full: "max-w-none",
  } as const;

  return (
    <Tag
      id={id}
      className={cn(
        "mx-auto w-full px-5 sm:px-8",
        widths[width],
        "py-16 sm:py-24",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** A small uppercase editorial label. The only uppercase type on the site. */
export function Eyebrow({
  children,
  className,
  dot = true,
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "label-eyebrow inline-flex items-center gap-2.5 text-[rgb(var(--label))]",
        className
      )}
    >
      {dot && (
        <span className="h-px w-6 shrink-0 bg-[rgb(var(--label))]/60" aria-hidden />
      )}
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow dot={align === "left"}>{eyebrow}</Eyebrow>}
      <h2 className={cn("display-lg", eyebrow && "mt-5")}>{title}</h2>
      {lead && <p className="lead mt-5">{lead}</p>}
    </div>
  );
}

/** A full-width hairline used to separate major bands of the page. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-[rgb(var(--hairline))]", className)} aria-hidden />;
}
