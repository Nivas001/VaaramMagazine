"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeProvider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/archives", label: "Archives" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /**
   * The home page opens on a dark cinematic band, so the bar sits transparent
   * over it in light-on-dark and only takes on its own surface once the reader
   * has scrolled past the hero.
   */
  const overlay = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Lock the page behind the open drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      data-overlay={overlay || undefined}
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        overlay
          ? "border-b border-transparent bg-transparent"
          : "chrome-blur border-b border-[rgb(var(--hairline))]"
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8",
          "h-16 sm:h-[72px]",
          // Over the dark hero every child inherits the light-on-dark palette.
          overlay && "[--text:245_242_237] [--text-muted:190_182_172] [--text-faint:170_162_152] [--hairline:255_255_255]"
        )}
      >
        <Link href="/" className="group -ml-1 flex shrink-0 items-center rounded-md px-1 py-1">
          <Logo size="md" />
          <span className="sr-only">Vaaram Magazine — home</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium transition-colors",
                    active
                      ? "text-[rgb(var(--text))]"
                      : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  )}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                      }
                      className="absolute inset-0 -z-10 rounded-full bg-[rgb(var(--text))]/[0.07]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/archives"
            className={cn(
              "hidden h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors sm:inline-flex",
              overlay
                ? "bg-white text-warm-950 hover:bg-warm-100"
                : "bg-[rgb(var(--accent))] text-white hover:bg-wine-strong"
            )}
          >
            Read this week
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--text))]/[0.06] md:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </nav>

      <MobileDrawer open={open} onClose={() => setOpen(false)} pathname={pathname} />
    </header>
  );
}

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  /**
   * Rendered into <body> rather than inside the header.
   *
   * The header carries a backdrop-filter, and a filtered element becomes the
   * containing block for any fixed-position descendant — which quietly clamped
   * this drawer's `inset-0` to the height of the header bar itself.
   */
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
          className="fixed inset-0 z-[60] bg-[rgb(var(--surface))] md:hidden"
        >
          <div className="flex h-16 items-center justify-between px-5">
            <Logo size="md" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text))]"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav aria-label="Mobile" className="px-5 pt-6">
            <ul className="flex flex-col">
              {LINKS.map(({ href, label }, i) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <motion.li
                    key={href}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduce ? 0 : 0.05 + i * 0.05, duration: 0.3 }}
                    className="border-b border-[rgb(var(--hairline))]"
                  >
                    <Link
                      href={href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className="flex items-center justify-between py-5 font-display text-3xl tracking-[-0.02em]"
                    >
                      <span className={active ? "text-[rgb(var(--accent-text))]" : undefined}>
                        {label}
                      </span>
                      <ArrowRight
                        className="size-5 text-[rgb(var(--text-faint))]"
                        aria-hidden
                      />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <Link
              href="/archives"
              onClick={onClose}
              className="mt-8 flex h-14 items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-[15px] font-semibold text-white"
            >
              Read this week&apos;s edition
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
