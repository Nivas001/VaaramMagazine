import Link from "next/link";
import { Masthead } from "@/components/site/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16 text-center">
      <div className="max-w-md">
        <div className="flex justify-center">
          <Masthead className="items-center" />
        </div>

        <p className="mt-14 font-display text-7xl leading-none tracking-[-0.04em] text-[rgb(var(--accent))] sm:text-8xl">
          404
        </p>
        <h1 className="display-md mt-6">We couldn&apos;t find that page</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
          The edition may have moved, or it may not be published yet. Everything Vaaram has
          published is kept in the archive.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/archives"
            className="inline-flex h-12 items-center rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
          >
            Browse the archive
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-full border border-[rgb(var(--hairline))] px-6 text-sm font-semibold transition-colors hover:bg-[rgb(var(--surface-2))]"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
