"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";
import { siteConfig } from "@/site.config";
import { BANNER_PLACEMENTS } from "@/lib/types";
import { createBanner } from "@/app/admin/actions";
import { putToStorage, requestTicket } from "./UploadToStorage";
import { cn, formatBytes } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-[rgb(var(--text)/0.12)] bg-[rgb(var(--glass-tint)/0.55)] px-4 py-3 text-sm outline-none transition-all focus:border-[var(--color-violet)] focus:ring-4 focus:ring-[var(--color-violet)]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function BannerForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function pick(incoming: File | null) {
    setError(null);
    if (!incoming) return;
    if (!IMAGE_TYPES.includes(incoming.type)) {
      setError("Banner images must be JPG, PNG or WebP.");
      return;
    }
    setFile(incoming);
    setPreview(URL.createObjectURL(incoming));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the banner image first.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const clientName = String(data.get("clientName") ?? "").trim();
    if (!clientName) {
      setError("Enter the advertiser's name so you can identify this banner later.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(0);

    try {
      const ticket = await requestTicket(file.name, file.type);
      await putToStorage(ticket, file, setProgress);

      const result = await createBanner({
        clientName,
        targetUrl: String(data.get("targetUrl") ?? "").trim(),
        imageUrl: ticket.publicUrl,
        imageKey: ticket.objectKey,
        placement: String(data.get("placement") ?? "home_hero"),
        edition: String(data.get("edition") ?? "") || null,
        expiresAt: String(data.get("expiresAt") ?? "") || null,
      });

      if (!result.ok) throw new Error(result.error);

      formRef.current?.reset();
      setFile(null);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the banner.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="bento glass glass-sheen p-6">
      <h2 className="text-lg font-bold">Add a banner</h2>
      <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">
        Upload the advertiser&apos;s artwork and choose where it should appear.
      </p>

      <div
        onClick={() => !busy && inputRef.current?.click()}
        className={cn(
          "mt-5 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition-all",
          "border-[rgb(var(--text)/0.16)] hover:border-[var(--color-violet)]/60",
          busy && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        {preview ? (
          <div className="relative">
            <img src={preview} alt="Banner preview" className="mx-auto max-h-40 rounded-xl" />
            <p className="mt-2.5 text-xs text-[rgb(var(--text-muted))]">
              {file?.name} · {formatBytes(file?.size ?? 0)}
            </p>
            {!busy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute right-0 top-0 grid size-8 place-items-center rounded-full bg-black/50 text-white"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto size-8 text-[rgb(var(--text-muted))]" />
            <p className="mt-2.5 text-sm font-semibold">Choose the banner image</p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">JPG, PNG or WebP</p>
          </>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <div>
          <label htmlFor="clientName" className={label}>
            Advertiser name <span className="text-[var(--color-rose)]">*</span>
          </label>
          <input id="clientName" name="clientName" required maxLength={160} className={field} placeholder="e.g. Sri Balaji Motors" />
        </div>

        <div>
          <label htmlFor="targetUrl" className={label}>
            Link when clicked{" "}
            <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
          </label>
          <input id="targetUrl" name="targetUrl" type="url" className={field} placeholder="https://example.com" />
        </div>

        <div>
          <label htmlFor="placement" className={label}>
            Where it appears
          </label>
          <select id="placement" name="placement" className={cn(field, "appearance-none")} defaultValue="home_hero">
            {BANNER_PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} — {p.hint}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edition" className={label}>
              Only in one edition?
            </label>
            <select id="edition" name="edition" className={cn(field, "appearance-none")} defaultValue="">
              <option value="">Show in all editions</option>
              {siteConfig.editions.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.name} only
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="expiresAt" className={label}>
              Stop showing on{" "}
              <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <input id="expiresAt" name="expiresAt" type="date" className={field} />
          </div>
        </div>
      </div>

      {busy && (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-stone-900 dark:bg-stone-100 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? `Uploading — ${progress}%` : "Add banner"}
      </button>
    </form>
  );
}
