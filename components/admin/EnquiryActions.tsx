"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/app/admin/actions";

type Status = "new" | "contacted" | "closed";

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

  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["new", "contacted", "closed"] as Status[]).map((option) => (
        <button
          key={option}
          onClick={() => run(() => onSetStatus(id, option))}
          disabled={pending || status === option}
          className={`${base} ${
            status === option
              ? "bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-fuchsia))] text-white"
              : "bg-[rgb(var(--glass-tint)/0.9)] hover:bg-[rgb(var(--glass-tint))]"
          }`}
        >
          {pending && status !== option && <Loader2 className="size-3.5 animate-spin" />}
          Mark {option}
        </button>
      ))}

      {confirming ? (
        <>
          <button
            onClick={() => run(() => onDelete(id))}
            disabled={pending}
            className={`${base} bg-[var(--color-rose)] text-white`}
          >
            <Trash2 className="size-3.5" /> Confirm delete
          </button>
          <button onClick={() => setConfirming(false)} className={`${base} text-[rgb(var(--text-muted))]`}>
            Cancel
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className={`${base} ml-auto text-[rgb(var(--text-muted))] hover:bg-[var(--color-rose)]/10 hover:text-[var(--color-rose)]`}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
