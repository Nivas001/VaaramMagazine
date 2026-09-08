import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Vaaram Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login page renders its own shell; middleware guards every other route.
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-[rgb(var(--surface-2))]">
      <AdminNav email={user.email ?? ""} />
      <main id="main" className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
