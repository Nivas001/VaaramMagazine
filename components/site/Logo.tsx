import { siteConfig } from "@/site.config";
import { VaaramMark } from "@/components/site/VaaramMark";
import { cn } from "@/lib/utils";

/**
 * The Vaaram lockup: the bird mark beside the wordmark.
 *
 * The printed logo carries the web address under the tagline. That is right on
 * a flyer and wrong on the website itself — a visitor is already here, and a
 * URL inside the header would be the one piece of the mark nobody can act on.
 * So the lockup here is mark + name (+ tagline where there is room), and the
 * address is left to the footer, where it belongs.
 */
export function Logo({
  size = "md",
  showNative = true,
  showTagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  showNative?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  const scale = {
    sm: { mark: "size-7", word: "text-[18px]", native: "text-[10px]", tag: "text-[9px]", gap: "gap-2" },
    md: { mark: "size-9", word: "text-[23px]", native: "text-[11px]", tag: "text-[10px]", gap: "gap-2.5" },
    lg: { mark: "size-12", word: "text-[32px]", native: "text-[13px]", tag: "text-[11px]", gap: "gap-3" },
    xl: { mark: "size-16", word: "text-[44px]", native: "text-[16px]", tag: "text-[12px]", gap: "gap-4" },
  }[size];

  return (
    <span className={cn("inline-flex select-none items-center", scale.gap, className)}>
      <VaaramMark
        className={cn(
          scale.mark,
          "shrink-0 transition-transform duration-500 group-hover:-translate-y-px"
        )}
      />

      <span className="inline-flex min-w-0 flex-col justify-center">
        <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "font-display font-medium leading-none tracking-[-0.03em] text-[rgb(var(--text))]",
              "transition-colors group-hover:text-[rgb(var(--accent-text))]",
              scale.word
            )}
          >
            Vaaram
          </span>

          {showNative && (
            <span
              className={cn(
                "font-tamil leading-none text-[rgb(var(--text-faint))]",
                scale.native
              )}
              // The Tamil name is decorative beside the Latin wordmark; screen
              // readers already have "Vaaram" and should not hear it twice.
              aria-hidden
            >
              {siteConfig.nativeName}
            </span>
          )}
        </span>

        {showTagline && (
          <span
            className={cn(
              // Single line once there is room to hold it (roughly the width
              // a two-column footer grants this block); wraps rather than
              // forcing the whole lockup wider on a narrow phone.
              "label-eyebrow mt-1.5 max-w-[15rem] whitespace-normal sm:max-w-none sm:whitespace-nowrap",
              "text-[rgb(var(--label))]",
              scale.tag
            )}
            aria-hidden
          >
            {siteConfig.tagline}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * The stacked masthead used in the footer, on the login screen and on the 404
 * page, where the mark has room to breathe.
 */
export function Masthead({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex flex-col gap-3.5", className)}>
      <Logo size="lg" showTagline />
      <span className="h-px w-full bg-[rgb(var(--hairline))]" aria-hidden />
      <span className="label-eyebrow text-[rgb(var(--text-faint))]">
        Weekly advertising magazine
      </span>
    </div>
  );
}
