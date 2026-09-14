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
    sm: { w: 94, h: 36, class: "h-[36px] w-[94px]" },
    md: { w: 146, h: 56, class: "h-[46px] w-[120px] sm:h-[56px] sm:w-[146px]" },
    lg: { w: 188, h: 72, class: "h-[60px] w-[157px] sm:h-[72px] sm:w-[188px]" },
    xl: { w: 234, h: 90, class: "h-[78px] w-[203px] sm:h-[90px] sm:w-[234px]" },
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

