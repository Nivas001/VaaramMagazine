"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OtpInput } from "./OtpInput";
import { cn } from "@/lib/utils";

const RESEND_SECONDS = 45;

type AuthMode = "password" | "otp";
type OtpStep = "email" | "code";

function Form() {
  const router = useRouter();
  const params = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("password");
  const [step, setStep] = useState<OtpStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Resend countdown for OTP.
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const onSignInWithPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : authError.message
        );
        setBusy(false);
        return;
      }

      if (data?.session) {
        router.replace(params.get("next") || "/admin");
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.");
      setBusy(false);
    }
  };

  const sendCode = useCallback(
    async (address: string) => {
      setBusy(true);
      setError(null);

      try {
        const supabase = createClient();
        const { error: sendError } = await supabase.auth.signInWithOtp({
          email: address,
          options: {
            shouldCreateUser: false,
          },
        });

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error. Please try again.");
        return false;
      } finally {
        setBusy(false);
      }
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

      try {
        const supabase = createClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: "email",
        });

        if (verifyError) {
          setInvalid(true);
          setError(
            /expired/i.test(verifyError.message)
              ? "That code has expired. Send a new one."
              : "That code is not right. Check it and try again."
          );
          return;
        }

        router.replace(params.get("next") || "/admin");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Verification failed.");
      } finally {
        setBusy(false);
      }
    },
    [email, params, router]
  );

  const field = cn(
    "h-12 w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))]",
    "px-3.5 text-[15px] text-[rgb(var(--text))] outline-none transition-colors",
    "placeholder:text-[rgb(var(--text-faint))] focus:border-[rgb(var(--accent))]"
  );

  /* ── Mode 1: Password Login (Default & Instant) ───────────────────────── */
  if (mode === "password") {
    return (
      <form onSubmit={onSignInWithPassword} className="card p-7 sm:p-8">
        <div>
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
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(field, "mt-2.5")}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="password" className="label-eyebrow block text-[rgb(var(--text-faint))]">
            Password
          </label>
          <div className="relative mt-2.5">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(field, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-faint))] transition-colors hover:text-[rgb(var(--text))]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <button
          type="submit"
          disabled={busy || !email.trim() || !password}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(var(--accent))] text-[15px] font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <Lock className="size-4" aria-hidden />
              <span>Sign in</span>
            </>
          )}
        </button>

        <div className="mt-6 border-t border-[rgb(var(--hairline))] pt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError(null);
            }}
            className="text-[13px] font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
          >
            Sign in with email verification code instead &rarr;
          </button>
        </div>
      </form>
    );
  }

  /* ── Mode 2: OTP Step 1 (email input) ────────────────────────────────── */
  if (step === "email") {
    return (
      <form onSubmit={onSubmitEmail} className="card p-7 sm:p-8">
        <label htmlFor="email-otp" className="label-eyebrow block text-[rgb(var(--text-faint))]">
          Administrator email
        </label>
        <input
          id="email-otp"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          placeholder="name@example.com"
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

        <div className="mt-6 border-t border-[rgb(var(--hairline))] pt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError(null);
            }}
            className="text-[13px] font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
          >
            &larr; Sign in with password instead
          </button>
        </div>
      </form>
    );
  }

  /* ── Mode 2: OTP Step 2 (code input) ─────────────────────────────────── */
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

      <div className="mt-6 border-t border-[rgb(var(--hairline))] pt-5 text-center">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setStep("email");
            setError(null);
          }}
          className="text-[13px] font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
        >
          &larr; Sign in with password instead
        </button>
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

