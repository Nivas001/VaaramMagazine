"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { moveBanner } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

/**
 * Moves one banner up or down its rail.
 *
 * Two buttons rather than dragging: a click is unambiguous, works from the
 * keyboard, and behaves the same on a phone — where dragging a row inside a
 * scrolling list is unreliable. Large moves are done by typing a position on
 * the edit form instead, which beats nineteen clicks.
 */
export function MoveButtons({
  id,
  isFirst,
  isLast,
}: {
  id: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveBanner(id, direction);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const button =
    "grid size-9 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => move("up")}
        disabled={pending || isFirst}
        aria-label="Move up"
        className={button}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ArrowUp className="size-3.5" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={pending || isLast}
        aria-label="Move down"
        className={button}
      >
        <ArrowDown className="size-3.5" aria-hidden />
      </button>

      {error && (
        <span className={cn("text-[12px] text-rose-600 dark:text-rose-400")}>{error}</span>
      )}
    </div>
  );
}
