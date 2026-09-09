import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { Masthead } from "@/components/site/Logo";
import { SearchIllustration } from "@/components/ui/Illustration";

const ROUTES = [
  { href: "/archives", label: "Every edition", hint: "The full archive, free to read" },
  { href: "/about", label: "How Vaaram works", hint: "What the magazine is and who is in it" },
  { href: "/contact", label: "Advertise with us", hint: "Get into next week's edition" },
];

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center">
          <Masthead className="items-center text-center" />
        </div>

        <div className="mt-14 flex justify-center">
          <SearchIllustration className="max-w-[220px]" />
        </div>

        <h1 className="display-md mt-10 text-center">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
          The edition may have moved, or it may not be published yet. Everything Vaaram
          has published is kept in the archive — nothing is ever taken down.
        </p>

        <ul className="mt-10 border-t border-[rgb(var(--hairline))]">
          {ROUTES.map(({ href, label, hint }) => (
            <li key={href} className="border-b border-[rgb(var(--hairline))]">
              <Link
                href={href}
                className="group flex items-center justify-between gap-6 py-4"
              >
                <span>
                  <span className="block font-display text-[21px] tracking-[-0.02em] transition-colors group-hover:text-[rgb(var(--accent-text))]">
                    {label}
                  </span>
                  <span className="mt-1 block text-[14px] text-[rgb(var(--text-muted))]">
                    {hint}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-[rgb(var(--text-faint))] transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/archives"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <Search className="size-4" aria-hidden />
            Search the archive
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-6 text-sm font-semibold transition-colors hover:bg-[rgb(var(--surface-2))]"
          >
            <Home className="size-4" aria-hidden />
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
