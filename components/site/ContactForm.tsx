"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import { siteConfig } from "@/site.config";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The advertising enquiry form.
 *
 * Validation is done natively by the browser first and confirmed on the server,
 * so nothing here is the only thing standing between a bad payload and the
 * database. Errors are announced rather than only coloured red.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          category: data.get("category"),
          subject: data.get("category")
            ? `Advertising enquiry — ${data.get("category")}`
            : "Advertising enquiry",
          message: data.get("message"),
          // Honeypot: a real person never sees or fills this.
          company_website: data.get("company_website"),
          source: "contact",
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : `We could not send that. Please email ${siteConfig.contact.email} instead.`
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="card flex flex-col items-start p-8 sm:p-10">
        <span className="grid size-11 place-items-center rounded-full bg-[rgb(var(--accent))]/12 text-[rgb(var(--accent))]">
          <Check className="size-5" aria-hidden />
        </span>
        <h3 className="mt-6 font-display text-2xl tracking-[-0.02em]">Message received</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
          Thank you — we will get back to you during office hours. If it is urgent, call
          us on {siteConfig.contact.phone}.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 text-sm font-semibold text-[rgb(var(--text))] underline decoration-[rgb(var(--hairline))] underline-offset-[6px] transition-colors hover:text-[rgb(var(--accent))]"
        >
          Send another message
        </button>
      </div>
    );
  }

  const busy = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate={false} className="card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" required autoComplete="name" />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          hint="So we can reach you quickly"
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" optional />

        <div>
          <label
            htmlFor="category"
            className="label-eyebrow block text-[rgb(var(--text-faint))]"
          >
            What are you advertising?
          </label>
          <select
            id="category"
            name="category"
            defaultValue=""
            className={cn(
              "mt-2.5 h-12 w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))]",
              "px-3.5 text-[15px] text-[rgb(var(--text))] outline-none transition-colors",
              "focus:border-[rgb(var(--accent))]"
            )}
          >
            <option value="">Not sure yet</option>
            {siteConfig.categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="label-eyebrow block text-[rgb(var(--text-faint))]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you would like to advertise, and which week you have in mind."
          className={cn(
            "mt-2.5 w-full resize-y rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))]",
            "px-3.5 py-3 text-[15px] leading-relaxed text-[rgb(var(--text))] outline-none transition-colors",
            "placeholder:text-[rgb(var(--text-faint))] focus:border-[rgb(var(--accent))]"
          )}
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Leave this empty</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-md border border-[rgb(var(--accent))]/30 bg-[rgb(var(--accent))]/8 px-4 py-3 text-sm text-[rgb(var(--accent))]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-7 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[rgb(var(--accent))] text-[15px] font-semibold text-white transition-colors hover:bg-ember-strong disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        {busy ? "Sending…" : "Send enquiry"}
      </button>

      <p className="mt-4 text-[13px] text-[rgb(var(--text-faint))]">
        We only use these details to reply to your enquiry.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  optional = false,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label-eyebrow block text-[rgb(var(--text-faint))]">
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal opacity-70">optional</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={cn(
          "mt-2.5 h-12 w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))]",
          "px-3.5 text-[15px] text-[rgb(var(--text))] outline-none transition-colors",
          "focus:border-[rgb(var(--accent))]",
          // The browser's own invalid styling only appears after a submit
          // attempt, so a half-typed email is never flagged mid-keystroke.
          "user-invalid:border-[rgb(var(--accent))]"
        )}
      />
      {hint && <p className="mt-2 text-[13px] text-[rgb(var(--text-faint))]">{hint}</p>}
    </div>
  );
}
