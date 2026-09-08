import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Masthead } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to the site
        </Link>

        <div className="mt-10">
          <Masthead />
        </div>

        <h1 className="display-md mt-8">Sign in to publish</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
          This area is for the Vaaram publishing desk.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
