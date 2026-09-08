"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const BUTTON =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-50";

/** Show / hide plus delete, shared by the issues and banners lists. */
export function RowActions({
  id,
  isActive,
  onToggle,
  onDelete,
  confirmLabel,
  activeLabel = "Hide",
  inactiveLabel = "Show",
}: {
  id: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  confirmLabel: string;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => run(() => onToggle(id, !isActive))}
        disabled={pending}
        className={cn(
          BUTTON,
          "border border-[rgb(var(--hairline))] text-[rgb(var(--text))]",
          "hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
        )}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : isActive ? (
          <EyeOff className="size-3.5" aria-hidden />
        ) : (
          <Eye className="size-3.5" aria-hidden />
        )}
        {isActive ? activeLabel : inactiveLabel}
      </button>

      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => run(() => onDelete(id))}
            disabled={pending}
            className={cn(BUTTON, "bg-[rgb(var(--accent))] text-white hover:bg-ember-strong")}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-3.5" aria-hidden />
            )}
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(BUTTON, "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]")}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={cn(
            BUTTON,
            "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--accent))]/10 hover:text-[rgb(var(--accent))]"
          )}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </button>
      )}

      {error && (
        <span role="alert" className="text-[13px] text-[rgb(var(--accent))]">
          {error}
        </span>
      )}
    </div>
  );
}
