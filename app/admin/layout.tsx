import type { Metadata } from "next";
import { Aurora } from "@/components/ui/Aurora";
import { AdminNav } from "@/components/admin/AdminNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
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
    <>
      <Aurora variant="calm" />
      <div className="min-h-dvh">
        <AdminNav email={user.email ?? ""} />
        <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-6 sm:px-8">{children}</main>
      </div>
    </>
  );
}
