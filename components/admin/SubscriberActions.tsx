"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Undo2, UserMinus } from "lucide-react";
import type { ActionResult } from "@/app/admin/actions";

/**
 * Removing a reader marks the row inactive rather than deleting it, so an
 * address that has asked to be left alone can never be silently re-added by a
 * later import.
 */
export function SubscriberActions({
  id,
  isActive,
  onToggle,
}: {
  id: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-[13px] text-[rgb(var(--accent-text))]">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await onToggle(id, !isActive);
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-semibold transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))] disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : isActive ? (
          <UserMinus className="size-3.5" aria-hidden />
        ) : (
          <Undo2 className="size-3.5" aria-hidden />
        )}
        {isActive ? "Unsubscribe" : "Restore"}
      </button>
    </div>
  );
}
