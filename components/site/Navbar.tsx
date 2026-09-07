"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig, whatsappLink } from "@/site.config";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeProvider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "HOME" },
  { href: "/editions", label: "ALL ISSUES" },
  { href: "/advertise", label: "ADVERTISE" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 transition-colors duration-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center">
          <Logo variant="compact" size="md" />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "font-display text-sm tracking-widest transition-colors duration-150",
                    active
                      ? "text-[#cd2129] border-b-2 border-[#cd2129] pb-0.5"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-[#cd2129] dark:hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2.5">
          <a
            href={whatsappLink("Hello Vaaram Magazine, I would like to get in touch.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 border border-[#25D366]/60 bg-[#25D366]/10 px-3 font-display text-xs uppercase tracking-wider text-[#25D366] font-bold hover:bg-[#25D366] hover:text-black transition-all"
          >
            <span className="size-1.5 rounded-full bg-[#25D366] animate-ping" />
            <MessageCircle className="size-3.5" />
            WHATSAPP
          </a>

          <ButtonLink href="/editions" size="sm" className="hidden md:inline-flex">
            LATEST ISSUE
          </ButtonLink>

          <ThemeToggle />

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-5 lg:hidden overflow-hidden"
          >
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block px-3 py-2.5 font-display text-lg tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-[#cd2129]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
              <a
                href={whatsappLink("Hello Vaaram Magazine, I would like to get in touch.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 bg-[#25D366] font-display text-xs uppercase tracking-wider text-black font-bold"
              >
                <MessageCircle className="size-4" /> CHAT DIRECTLY ON WHATSAPP
              </a>
              <ButtonLink href="/editions" size="md" className="w-full">
                GET THIS WEEK&apos;S ISSUE
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
