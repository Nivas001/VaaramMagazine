import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#cd2129] text-white hover:bg-[#b01b22] " +
    "shadow-sm transition-all duration-150 active:scale-[0.99]",
  glass:
    "border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#121212] text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 shadow-sm",
  ghost:
    "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
  outline:
    "border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-[#cd2129] hover:text-[#cd2129] hover:bg-[#cd2129]/5 dark:hover:bg-[#cd2129]/10",
  danger: "text-white bg-[#cd2129] hover:bg-[#b01b22] shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs font-bold uppercase tracking-wider gap-1.5",
  md: "h-11 px-5 text-sm font-bold uppercase tracking-wider gap-2",
  lg: "h-12 px-7 text-sm font-bold uppercase tracking-widest gap-2.5",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-none font-bold uppercase tracking-wider",
    "transition-all duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
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
