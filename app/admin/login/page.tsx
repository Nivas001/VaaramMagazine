import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { Aurora } from "@/components/ui/Aurora";
import { LoginForm } from "@/components/admin/LoginForm";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <Aurora variant="calm" />
      <main className="grid min-h-dvh place-items-center px-5 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))] text-white shadow-[0_14px_34px_-14px_rgba(124,58,237,0.9)]">
              <Newspaper className="size-6" />
            </span>
            <h1 className="mt-5 text-3xl font-extrabold">{siteConfig.name} Admin</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
              Sign in to publish this week&apos;s issue.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </>
  );
}
