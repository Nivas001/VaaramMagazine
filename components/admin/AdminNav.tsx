"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileUp, Images, LayoutDashboard, LogOut, MessageSquare, Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/site.config";

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/editions", label: "Issues", Icon: Newspaper },
  { href: "/admin/editions/new", label: "Publish", Icon: FileUp },
  { href: "/admin/banners", label: "Banners", Icon: Images },
  { href: "/admin/enquiries", label: "Enquiries", Icon: MessageSquare },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-900 bg-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 pr-2">
          <span className="grid size-8 place-items-center bg-[#cd2129] text-white font-display text-sm tracking-wider">
            199
          </span>
          <span className="hidden font-display text-lg tracking-wider sm:block text-white">
            {siteConfig.name} <span className="text-[#cd2129] text-xs">ADMIN</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1.5 ml-4">
          {links.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-colors",
                  active
                    ? "bg-[#cd2129] text-white font-normal"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-[180px] truncate font-sans text-xs text-neutral-500 lg:block">
            {email}
          </span>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-xs uppercase tracking-wider text-neutral-400 transition-colors hover:bg-[#cd2129]/10 hover:text-[#cd2129]"
            title="Sign out"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
