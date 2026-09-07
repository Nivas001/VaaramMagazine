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
      className="inline-flex h-11 items-center gap-2 border border-neutral-700 bg-neutral-900 px-6 font-bold text-xs uppercase tracking-wider text-white hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
    >
      {copied ? <Check className="size-4 text-[#cd2129]" /> : <Share2 className="size-4" />}
      {copied ? "LINK COPIED" : "SHARE"}
    </button>
  );
}
