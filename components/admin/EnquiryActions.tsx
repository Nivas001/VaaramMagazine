"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

type Status = "new" | "contacted" | "closed";

const STATUSES: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const BUTTON =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors disabled:opacity-60";

export function EnquiryActions({
  id,
  status,
  onSetStatus,
  onDelete,
}: {
  id: string;
  status: Status;
  onSetStatus: (id: string, status: Status) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run(fn: () => Promise<ActionResult>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* A segmented control: the current status is selected, not a button. */}
      <div
        role="group"
        aria-label="Enquiry status"
        className="flex items-center gap-0.5 rounded-full border border-[rgb(var(--hairline))] p-1"
      >
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => run(() => onSetStatus(id, value))}
            disabled={pending || status === value}
            aria-pressed={status === value}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
              status === value
                ? "bg-[rgb(var(--text))] text-[rgb(var(--surface))]"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] disabled:opacity-60"
            )}
          >
            {pending && status !== value && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            )}
            {label}
          </button>
        ))}
      </div>

      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => run(() => onDelete(id))}
            disabled={pending}
            className={cn(BUTTON, "bg-[rgb(var(--accent))] text-white hover:bg-wine-strong")}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(BUTTON, "text-[rgb(var(--text-muted))]")}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Delete enquiry"
          className={cn(
            BUTTON,
            "ml-auto text-[rgb(var(--text-faint))] hover:bg-[rgb(var(--accent))]/10 hover:text-[rgb(var(--accent-text))]"
          )}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
