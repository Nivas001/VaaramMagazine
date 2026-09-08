"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileUp,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/issues", label: "Issues", Icon: Newspaper },
  { href: "/admin/issues/new", label: "Publish", Icon: FileUp },
  { href: "/admin/enquiries", label: "Enquiries", Icon: MessageSquare },
  { href: "/admin/banners", label: "Banners", Icon: Images },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--hairline))] chrome-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <Logo size="sm" showNative={false} />
          <span className="label-eyebrow rounded-full bg-[rgb(var(--surface-2))] px-2.5 py-1 text-[rgb(var(--text-faint))]">
            Admin
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden max-w-[200px] truncate text-[13px] text-[rgb(var(--text-faint))] lg:block">
            {email}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-medium text-[rgb(var(--text-muted))] transition-colors hover:border-[rgb(var(--text-faint))] hover:text-[rgb(var(--text))]"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* The section rail scrolls sideways on a phone rather than wrapping. */}
      <nav aria-label="Admin sections" className="border-t border-[rgb(var(--hairline))]">
        <ul className="no-scrollbar mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 sm:px-7">
          {LINKS.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-[rgb(var(--accent))] text-[rgb(var(--text))]"
                      : "border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
