"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Masthead } from "@/components/site/Logo";

/**
 * The last line of defence for a render that threw.
 *
 * It says what a reader can actually do next — reload, or go to the archive —
 * and never shows the error text, which would be meaningless to a reader and
 * occasionally revealing. The real error goes to the server console.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16 text-center">
      <div className="max-w-md">
        <div className="flex justify-center">
          <Masthead className="items-center" />
        </div>

        <h1 className="display-md mt-14">Something went wrong on our side</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
          This is our fault, not yours. Try again — and if it keeps happening, the whole
          archive is still there.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <RefreshCw className="size-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/archives"
            className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--hairline))] px-6 text-sm font-semibold transition-colors hover:bg-[rgb(var(--surface-2))]"
          >
            Browse the archive
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[12px] text-[rgb(var(--text-faint))]">
            Reference {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
