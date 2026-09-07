import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-gradient font-display text-7xl font-extrabold sm:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[rgb(var(--text-muted))]">
          The issue may have been moved or unpublished. Everything we have published is in the
          archive.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/editions"
            className="inline-flex h-12 items-center rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-fuchsia))] px-6 text-sm font-semibold text-white"
          >
            Browse all issues
          </Link>
          <Link
            href="/"
            className="glass inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
