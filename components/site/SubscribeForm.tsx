"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * One field: an address to tell when the next edition goes live.
 *
 * No name, no preferences, no "interests" — the only thing the publication
 * ever sends is a link to the week's issue, so asking for anything else would
 * be collecting data we have no use for.
 */
export function SubscribeForm({
  source = "home",
  tone = "light",
  className,
}: {
  /** Recorded on the row, so a list can be traced back to where it was built. */
  source?: string;
  /** "dark" is for the wine bands, where the field sits on a dark ground. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          company_website: data.get("company_website"),
          source,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "We could not sign you up just now.");
    }
  }

  const dark = tone === "dark";

  if (status === "sent") {
    return (
      <p
        className={cn(
          "inline-flex items-center gap-3 rounded-full px-5 py-3.5 text-[15px]",
          dark ? "bg-white/10 text-warm-100" : "bg-[rgb(var(--accent))]/10 text-[rgb(var(--text))]",
          className
        )}
        role="status"
      >
        <Check className="size-4 shrink-0 text-[rgb(var(--accent-text))]" aria-hidden />
        You&apos;re on the list. We&apos;ll email you every week.
      </p>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Your email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={busy}
            className={cn(
              "h-[52px] w-full rounded-full px-5 text-[15px] outline-none transition-colors",
              dark
                ? "border border-white/20 bg-white/[0.06] text-warm-50 placeholder:text-warm-500 focus:border-gold-soft/60"
                : "border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))] focus:border-[rgb(var(--accent))]"
            )}
          />
        </label>

        {/* Honeypot: off-screen and hidden from assistive tech, never focusable. */}
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
        />

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold transition-colors disabled:opacity-60",
            dark
              ? "bg-warm-50 text-warm-950 hover:bg-white"
              : "bg-[rgb(var(--accent))] text-white hover:bg-wine-strong"
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {busy ? "Signing you up" : "Notify me"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className={cn(
            "mt-3 inline-flex items-start gap-2 text-[13.5px]",
            dark ? "text-gold-soft" : "text-[rgb(var(--accent-text))]"
          )}
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <p
        className={cn(
          "mt-3 text-[13px]",
          dark ? "text-warm-400" : "text-[rgb(var(--text-faint))]"
        )}
      >
        One email a week, the edition link and nothing else. Unsubscribe any time.
      </p>
    </form>
  );
}
