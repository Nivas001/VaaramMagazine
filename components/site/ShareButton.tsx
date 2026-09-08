"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

/** Uses the native share sheet on mobile and falls back to copying the link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* The visitor dismissed the sheet — fall through to copying. */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Clipboard blocked; nothing useful left to try. */
    }
  }

  return (
    <button
      onClick={share}
      type="button"
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-5 text-sm font-semibold text-[rgb(var(--text))] transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
    >
      {copied ? (
        <Check className="size-4 text-[rgb(var(--accent))]" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
