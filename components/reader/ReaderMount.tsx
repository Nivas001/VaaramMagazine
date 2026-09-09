"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";

// pdf.js touches `window` and `DOMMatrix` at import time, so the reader must
// never be part of the server render.
const PdfReader = dynamic(
  () => import("./PdfReader").then((m) => m.PdfReader),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[62vh] place-items-center rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]">
        <div className="flex flex-col items-center gap-4 text-[rgb(var(--text-muted))]">
          <Loader2 className="size-6 animate-spin text-[rgb(var(--accent-text))]" aria-hidden />
          <p className="label-eyebrow">Loading the reader</p>
        </div>
      </div>
    ),
  }
);

export function ReaderMount({
  url,
  title,
  publicationId,
}: {
  url: string;
  title: string;
  publicationId: string;
}) {
  // Fire-and-forget counters: a failed count must never affect reading.
  const track = useCallback(
    (type: "publication_view" | "publication_download") => {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id: publicationId }),
        keepalive: true,
      }).catch(() => {});
    },
    [publicationId]
  );

  // One view per opened issue.
  useEffect(() => {
    track("publication_view");
  }, [track]);

  return (
    <PdfReader url={url} title={title} onDownload={() => track("publication_download")} />
  );
}
