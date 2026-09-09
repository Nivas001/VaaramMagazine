import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VAARAM OFFICIAL LOGO
 *
 *  Renders the client-provided 3D embossed brand lockup:
 *  - Metallic burgundy bird emblem with rose gold inner feathers
 *  - 3D embossed "VAARAM" wordmark
 *  - Embossed "MAGAZINE" descriptor
 *  - "Discover. Connect. Every week." brand tagline
 *  (Website URL text removed per client specification)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function Logo({
  size = "md",
  priority = false,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  /** Kept for backwards compatibility with earlier callers. */
  showNative?: boolean;
  showTagline?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const dimensions = {
    sm: { w: 78, h: 30, class: "h-[30px] w-[78px]" },
    md: { w: 120, h: 46, class: "h-[40px] w-[104px] sm:h-[46px] sm:w-[120px]" },
    lg: { w: 167, h: 64, class: "h-[54px] w-[141px] sm:h-[64px] sm:w-[167px]" },
    xl: { w: 208, h: 80, class: "h-[70px] w-[182px] sm:h-[80px] sm:w-[208px]" },
  }[size];

  return (
    <span className={cn("inline-flex select-none items-center", className)}>
      <Image
        src="/brand/vaaram-logo-transparent.webp"
        alt="Vaaram Magazine — Discover. Connect. Every week."
        width={dimensions.w}
        height={dimensions.h}
        priority={priority}
        className={cn(
          dimensions.class,
          "object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        )}
      />
    </span>
  );
}

/**
 * The stacked masthead used in the footer, on the login screen, and on the 404
 * page where the mark has room to breathe.
 */
export function Masthead({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex flex-col gap-3", className)}>
      <Logo size="lg" priority={false} />
      <span className="h-px w-full max-w-[180px] bg-[rgb(var(--hairline))]" aria-hidden />
      <span className="label-eyebrow text-[rgb(var(--text-faint))]">
        Weekly advertising magazine
      </span>
    </div>
  );
}

