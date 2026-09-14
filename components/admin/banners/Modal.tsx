"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A plain centred dialog.
 *
 * Written by hand rather than pulled in: the admin has no component library,
 * and what is needed here is a box, a backdrop, Escape, a click outside and
 * the scroll lock. A dependency for that would be larger than the file.
 */
export function Modal({
  open,
  onClose,
  title,
  lead,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    // The page behind must not scroll under the dialog.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus moves into the dialog, or the keyboard is left behind the backdrop.
    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px] sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "my-auto w-full rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] shadow-lift outline-none",
          wide ? "max-w-5xl" : "max-w-2xl"
        )}
      >
        <div className="flex items-start gap-4 border-b border-[rgb(var(--hairline))] px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl tracking-[-0.02em]">{title}</h2>
            {lead && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[rgb(var(--text-muted))]">
                {lead}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="border-t border-[rgb(var(--hairline))] px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
