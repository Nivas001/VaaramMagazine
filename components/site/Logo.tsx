import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "compact" | "mark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  className?: string;
}

/**
 * Vaaram Magazine Official Brand Logo
 * Razor-sharp athletic geometry, crimson red accent, and high-impact Bayon typography.
 */
export function Logo({
  variant = "full",
  size = "md",
  showSlogan = false,
  className,
}: LogoProps) {
  const emblemSizes = {
    sm: "size-7",
    md: "size-9",
    lg: "size-12",
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const badgeSizes = {
    sm: "text-[8px] px-1 py-0.5",
    md: "text-[9px] px-1.5 py-0.5",
    lg: "text-[11px] px-2 py-0.5",
  };

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {/* ── Geometric Emblem "V" ────────────────────────────────────────── */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center border border-neutral-800 bg-[#0c0c0c] transition-transform duration-200 group-hover:scale-105",
          emblemSizes[size]
        )}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-4/5"
        >
          {/* Left Wing - Sharp Crisp White */}
          <path
            d="M8 8H18L24 36L18 36L8 8Z"
            fill="#FFFFFF"
          />
          {/* Right Wing - Channel 199 High-Voltage Crimson Red */}
          <path
            d="M40 8H30L22 36H28L40 8Z"
            fill="#CD2129"
          />
          {/* Central Connecting Blade */}
          <path
            d="M18 8L24 24L30 8H24L18 8Z"
            fill="#CD2129"
            fillOpacity="0.85"
          />
          {/* Gold North Star / Connection Compass */}
          <polygon
            points="24,11 26,16 31,16 27,19 29,24 24,21 19,24 21,19 17,16 22,16"
            fill="#D2AC47"
          />
        </svg>
        {/* Dynamic Red Corner Accent */}
        <div className="absolute -bottom-0.5 -right-0.5 size-1.5 bg-[#cd2129]" />
      </div>

      {/* ── Wordmark & Slogan ───────────────────────────────────────────── */}
      {variant !== "mark" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-display tracking-widest text-neutral-950 dark:text-white uppercase transition-colors group-hover:text-[#cd2129]",
                titleSizes[size]
              )}
            >
              VAARAM
            </span>
            <span
              className={cn(
                "bg-[#cd2129] font-display font-normal uppercase tracking-widest text-white",
                badgeSizes[size]
              )}
            >
              MAGAZINE
            </span>
          </div>

          {(showSlogan || variant === "full") && (
            <span className="mt-1 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-[#b89028] dark:text-[#d2ac47]">
              DISCOVER • CONNECT • EVERY WEEK
            </span>
          )}
        </div>
      )}
    </div>
  );
}
