import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

/**
 * The Vaaram wordmark.
 *
 * A publication's mark is its name set well, so this is pure typography: the
 * editorial serif for "Vaaram", the Tamil வாரம் ("week") set quietly beside it,
 * and a hairline rule standing in for a masthead.
 */
export function Logo({
  size = "md",
  showNative = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showNative?: boolean;
  className?: string;
}) {
  const wordmark = {
    sm: "text-[19px]",
    md: "text-[23px]",
    lg: "text-[34px]",
  }[size];

  const native = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-[14px]",
  }[size];

  return (
    <span className={cn("inline-flex select-none items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-display font-medium leading-none tracking-[-0.03em] text-[rgb(var(--text))]",
          "transition-colors group-hover:text-[rgb(var(--accent))]",
          wordmark
        )}
      >
        Vaaram
      </span>

      {showNative && (
        <span
          className={cn(
            "font-tamil leading-none text-[rgb(var(--text-faint))] translate-y-[-1px]",
            native
          )}
          // The Tamil name is decorative beside the Latin wordmark; screen
          // readers already have "Vaaram" and should not hear it twice.
          aria-hidden
        >
          {siteConfig.nativeName}
        </span>
      )}
    </span>
  );
}

/**
 * The stacked masthead used in the footer and on the login screen, where the
 * mark has room to breathe.
 */
export function Masthead({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex flex-col gap-3", className)}>
      <Logo size="lg" />
      <span className="h-px w-full bg-[rgb(var(--hairline))]" aria-hidden />
      <span className="label-eyebrow text-[rgb(var(--label))]">
        Weekly advertising magazine
      </span>
    </div>
  );
}
