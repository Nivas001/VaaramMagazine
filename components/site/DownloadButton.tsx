"use client";

import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A normal download link that also records the download.
 *
 * The counter is fired with `keepalive` so it still reaches the server while
 * the browser is starting the file transfer, and the link's default behaviour
 * is never blocked — a failed count must never cost a reader their download.
 */
export function DownloadButton({
  url,
  publicationId,
  label = "Download PDF",
  className,
}: {
  url: string;
  publicationId: string;
  label?: string;
  className?: string;
}) {
  function record() {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "publication_download", id: publicationId }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      onClick={record}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold",
        "bg-[rgb(var(--accent))] text-white transition-colors hover:bg-ember-strong",
        className
      )}
    >
      <Download className="size-4" aria-hidden />
      {label}
    </a>
  );
}
