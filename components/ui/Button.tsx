import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[rgb(var(--accent))] text-white hover:bg-wine-strong dark:hover:bg-wine " +
    "shadow-[0_1px_2px_rgba(28,22,16,0.16)]",
  secondary:
    "border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] text-[rgb(var(--text))] " +
    "hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]",
  ghost:
    "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]",
  inverse:
    "bg-[rgb(var(--text))] text-[rgb(var(--surface))] hover:opacity-88",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-[52px] px-7 text-[15px] gap-2.5 rounded-full",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-sans font-semibold",
    "transition-[background-color,border-color,color,opacity,transform] duration-200 ease-out",
    "active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45 cursor-pointer",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  external,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href">) {
  const cls = classes(variant, size, className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}

/**
 * A text link that reads as editorial rather than as a button — used for the
 * secondary action beside a primary call to action.
 */
export function TextLink({
  href,
  children,
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const cls = cn(
    "group inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--text))]",
    "underline decoration-[rgb(var(--hairline))] decoration-1 underline-offset-[6px]",
    "transition-colors hover:decoration-[rgb(var(--accent))] hover:text-[rgb(var(--accent-text))]",
    className
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
