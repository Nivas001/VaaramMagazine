"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/admin/actions";

/** Publish / unpublish + delete controls shared by the issues and banners tables. */
export function RowActions({
  id,
  isActive,
  onToggle,
  onDelete,
  confirmLabel,
}: {
  id: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  confirmLabel: string;
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

  const button =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => run(() => onToggle(id, !isActive))}
        disabled={pending}
        className={`${button} bg-[rgb(var(--glass-tint)/0.9)] hover:bg-[rgb(var(--glass-tint))]`}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isActive ? (
          <EyeOff className="size-3.5" />
        ) : (
          <Eye className="size-3.5" />
        )}
        {isActive ? "Hide" : "Show"}
      </button>

      {confirming ? (
        <>
          <button
            onClick={() => run(() => onDelete(id))}
            disabled={pending}
            className={`${button} bg-[var(--color-rose)] text-white hover:brightness-110`}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            {confirmLabel}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className={`${button} text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]`}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className={`${button} text-[rgb(var(--text-muted))] hover:bg-[var(--color-rose)]/10 hover:text-[var(--color-rose)]`}
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      )}

      {error && <span className="text-xs text-[var(--color-rose)]">{error}</span>}
    </div>
  );
}
