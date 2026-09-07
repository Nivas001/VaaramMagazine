"use client";

import { AlertTriangle, Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "That email and password combination did not work."
          : authError.message
      );
      setBusy(false);
      return;
    }

    // Full navigation so the middleware picks up the new session cookie.
    router.replace(params.get("next") || "/admin");
    router.refresh();
  }

  const field =
    "w-full rounded-xl border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm outline-none transition-all focus:border-stone-900 dark:focus:border-stone-100 focus:ring-1 focus:ring-stone-900/10";

  return (
    <form onSubmit={onSubmit} className="bento p-7">
      <label htmlFor="email" className="mb-1.5 block font-mono text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        Email
      </label>
      <input id="email" name="email" type="email" required autoComplete="username" className={field} />

      <label htmlFor="password" className="mb-1.5 mt-4 block font-mono text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className={field}
      />

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-sm transition-all disabled:opacity-60 cursor-pointer"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="bento glass h-80" />}>
      <Form />
    </Suspense>
  );
}
