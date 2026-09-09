"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies every active address as a comma-separated list, ready to paste into
 * the BCC field of whichever mail tool the publication uses.
 */
export function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* Clipboard is blocked in some browsers; the list is still on screen. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-5 text-sm font-semibold transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : `Copy ${emails.length} addresses`}
    </button>
  );
}
