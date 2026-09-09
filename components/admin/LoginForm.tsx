"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OtpInput } from "./OtpInput";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ADMIN SIGN IN — email one-time code
 *
 *  The code is generated, expired and rate-limited by Supabase Auth. Nothing
 *  here validates it: this component only collects the email, asks Supabase to
 *  send a code, and hands the typed code back for Supabase to verify. There is
 *  no client-side secret and no fallback code — if Supabase is not configured,
 *  sign-in correctly fails rather than letting anyone through.
 *
 *  Supabase's own settings decide who may sign in at all; leave sign-ups
 *  disabled on the project so only invited administrators can request a code.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RESEND_SECONDS = 45;

type Step = "email" | "code";

function Form() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Resend countdown.
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const sendCode = useCallback(
    async (address: string) => {
      setBusy(true);
      setError(null);
      const supabase = createClient();

      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          // Administrators are invited in the Supabase dashboard; the login
          // page must never be able to create a new account on its own.
          shouldCreateUser: false,
        },
      });

      setBusy(false);

      if (sendError) {
        setError(
          /rate|limit|too many/i.test(sendError.message)
            ? "Too many requests. Wait a minute before trying again."
            : sendError.message
        );
        return false;
      }

      setStep("code");
      setCode("");
      setInvalid(false);
      setCountdown(RESEND_SECONDS);
      return true;
    },
    []
  );

  async function onSubmitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendCode(email.trim());
  }

  const verify = useCallback(
    async (token: string) => {
      setBusy(true);
      setError(null);
      setInvalid(false);

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (verifyError) {
        setBusy(false);
        setInvalid(true);
        setError(
          /expired/i.test(verifyError.message)
            ? "That code has expired. Send a new one."
            : "That code is not right. Check it and try again."
        );
        return;
      }

      // A full navigation, so the middleware picks up the new session cookie.
      router.replace(params.get("next") || "/admin");
      router.refresh();
    },
    [email, params, router]
  );

  const field = cn(
    "h-12 w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))]",
    "px-3.5 text-[15px] text-[rgb(var(--text))] outline-none transition-colors",
    "placeholder:text-[rgb(var(--text-faint))] focus:border-[rgb(var(--accent))]"
  );

  /* ── Step 1: email ───────────────────────────────────────────────────── */
  if (step === "email") {
    return (
      <form onSubmit={onSubmitEmail} className="card p-7 sm:p-8">
        <label htmlFor="email" className="label-eyebrow block text-[rgb(var(--text-faint))]">
          Administrator email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          placeholder="you@vaaram.ca"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(field, "mt-3")}
        />

        {error && <ErrorNote>{error}</ErrorNote>}

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(var(--accent))] text-[15px] font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Mail className="size-4" aria-hidden />
          )}
          {busy ? "Sending code…" : "Email me a code"}
        </button>

        <p className="mt-4 text-[13px] leading-relaxed text-[rgb(var(--text-faint))]">
          We will email a six-digit code. It is valid for a few minutes and can only be
          used once.
        </p>
      </form>
    );
  }

  /* ── Step 2: code ────────────────────────────────────────────────────── */
  return (
    <div className="card p-7 sm:p-8">
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setError(null);
          setInvalid(false);
        }}
        className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Use a different email
      </button>

      <p className="mt-6 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
        We sent a six-digit code to{" "}
        <span className="font-semibold text-[rgb(var(--text))]">{email}</span>.
      </p>

      <div className="mt-7">
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next);
            if (invalid) setInvalid(false);
          }}
          onComplete={verify}
          disabled={busy}
          invalid={invalid}
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button
        type="button"
        onClick={() => verify(code)}
        disabled={busy || code.length < 6}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(var(--accent))] text-[15px] font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="size-4" aria-hidden />
        )}
        {busy ? "Verifying…" : "Verify and sign in"}
      </button>

      <div className="mt-5 text-[13px] text-[rgb(var(--text-faint))]">
        {countdown > 0 ? (
          <p aria-live="polite">
            You can request a new code in {countdown} second{countdown === 1 ? "" : "s"}.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => sendCode(email.trim())}
            disabled={busy}
            className="font-semibold text-[rgb(var(--text))] underline decoration-[rgb(var(--hairline))] underline-offset-4 transition-colors hover:text-[rgb(var(--accent-text))] disabled:opacity-50"
          >
            Send a new code
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-5 flex items-start gap-2.5 rounded-md border border-[rgb(var(--accent))]/30 bg-[rgb(var(--accent))]/8 px-4 py-3 text-sm text-[rgb(var(--accent-text))]"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="card h-80" />}>
      <Form />
    </Suspense>
  );
}
