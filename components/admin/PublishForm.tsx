"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { siteConfig } from "@/site.config";
import { createPublication } from "@/app/admin/actions";
import { inspectPdf } from "@/lib/pdf-client";
import { putToStorage, requestTicket } from "./UploadToStorage";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Phase = "idle" | "reading" | "uploading-pdf" | "uploading-cover" | "saving" | "done" | "error";

const field =
  "w-full rounded-2xl border border-[rgb(var(--text)/0.12)] bg-[rgb(var(--glass-tint)/0.55)] px-4 py-3 text-sm outline-none transition-all focus:border-[var(--color-violet)] focus:ring-4 focus:ring-[var(--color-violet)]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

/** Sunday of the current week — the natural default for a weekly paper. */
function defaultEditionDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PublishForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const busy = phase !== "idle" && phase !== "error" && phase !== "done";

  const pickFile = useCallback((incoming: File | null) => {
    setError(null);
    setPageCount(null);
    if (!incoming) return;
    if (incoming.type !== "application/pdf") {
      setError("That is not a PDF. Please choose the print-ready PDF of the issue.");
      return;
    }
    setFile(incoming);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the issue PDF first.");
      return;
    }

    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const edition = String(data.get("edition") ?? "");
    const editionDate = String(data.get("editionDate") ?? "");

    if (!title || !edition || !editionDate) {
      setError("Title, edition and date are all required.");
      return;
    }

    setError(null);
    setProgress(0);

    try {
      // 1. Read the PDF locally: page count + a cover image from page one.
      setPhase("reading");
      const { pageCount: pages, coverBlob } = await inspectPdf(file);
      setPageCount(pages);

      // 2. Send the PDF straight to storage.
      setPhase("uploading-pdf");
      const pdfTicket = await requestTicket(file.name, "application/pdf");
      await putToStorage(pdfTicket, file, setProgress);

      // 3. Send the generated cover (best-effort — never blocks publishing).
      let coverUrl: string | null = null;
      if (coverBlob) {
        setPhase("uploading-cover");
        setProgress(0);
        try {
          const coverTicket = await requestTicket(
            file.name.replace(/\.pdf$/i, "-cover.jpg"),
            "image/jpeg"
          );
          await putToStorage(coverTicket, coverBlob, setProgress);
          coverUrl = coverTicket.publicUrl;
        } catch (coverError) {
          console.warn("[publish] cover upload failed", coverError);
        }
      }

      // 4. Save the row.
      setPhase("saving");
      const result = await createPublication({
        title,
        description: String(data.get("description") ?? "").trim(),
        edition,
        editionDate,
        pdfUrl: pdfTicket.publicUrl,
        pdfKey: pdfTicket.objectKey,
        fileSizeBytes: file.size,
        totalPages: pages,
        coverUrl,
        isPublished: data.get("isPublished") === "on",
      });

      if (!result.ok) throw new Error(result.error);

      setPhase("done");
      router.refresh();
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Publishing failed. Please try again.");
    }
  }

  if (phase === "done") {
    return (
      <div className="bento glass glass-sheen p-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--color-emerald)]/15">
          <CheckCircle2 className="size-8 text-[var(--color-emerald)]" />
        </span>
        <h2 className="mt-5 text-2xl font-bold">Issue published</h2>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[rgb(var(--text-muted))]">
          It is live on the website now. Readers will see it on the home page and in the archive.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setFile(null);
              setPhase("idle");
              setProgress(0);
              setPageCount(null);
            }}
            className="inline-flex h-11 items-center rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-fuchsia))] px-6 text-sm font-semibold text-white"
          >
            Publish another
          </button>
          <a
            href="/editions"
            target="_blank"
            rel="noopener noreferrer"
            className="glass inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
          >
            View on the site
          </a>
        </div>
      </div>
    );
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "",
    reading: "Reading the PDF and making a cover image…",
    "uploading-pdf": `Uploading the PDF — ${progress}%`,
    "uploading-cover": `Uploading the cover image — ${progress}%`,
    saving: "Saving to the website…",
    done: "",
    error: "",
  };

  return (
    <form onSubmit={onSubmit} className="bento glass glass-sheen p-6 sm:p-8">
      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all",
          dragging
            ? "border-[var(--color-violet)] bg-[var(--color-violet)]/8"
            : "border-[rgb(var(--text)/0.16)] hover:border-[var(--color-violet)]/60",
          busy && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <div className="flex items-center justify-center gap-4 text-left">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))] text-white">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                {formatBytes(file.size)}
                {pageCount ? ` · ${pageCount} pages` : ""}
              </p>
            </div>
            {!busy && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPageCount(null);
                }}
                className="ml-2 grid size-8 shrink-0 place-items-center rounded-full text-[rgb(var(--text-muted))] transition-colors hover:bg-[var(--color-rose)]/10 hover:text-[var(--color-rose)]"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto size-9 text-[rgb(var(--text-muted))]" />
            <p className="mt-3 text-sm font-semibold">
              Drop this week&apos;s PDF here, or click to choose
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              The cover thumbnail and page count are worked out automatically.
            </p>
          </>
        )}
      </div>

      {/* ── Progress ──────────────────────────────────────────────────── */}
      {busy && (
        <div className="mt-5">
          <div className="flex items-center gap-2.5 text-sm font-medium text-[rgb(var(--text-muted))]">
            <Loader2 className="size-4 animate-spin text-[var(--color-violet)]" />
            {phaseLabel[phase]}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[rgb(var(--text)/0.08)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-fuchsia))] transition-[width] duration-200"
              style={{
                width:
                  phase === "uploading-pdf" || phase === "uploading-cover"
                    ? `${progress}%`
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Details ───────────────────────────────────────────────────── */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={label}>
            Issue title <span className="text-[var(--color-rose)]">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            className={field}
            placeholder="e.g. Issue 101 — Global Weekly"
          />
        </div>

        <div>
          <label htmlFor="edition" className={label}>
            Edition <span className="text-[var(--color-rose)]">*</span>
          </label>
          <select id="edition" name="edition" required className={cn(field, "appearance-none")} defaultValue={siteConfig.editions[0].slug}>
            {siteConfig.editions.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="editionDate" className={label}>
            Publication date <span className="text-[var(--color-rose)]">*</span>
          </label>
          <input
            id="editionDate"
            name="editionDate"
            type="date"
            required
            defaultValue={defaultEditionDate()}
            className={field}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={label}>
            Short description{" "}
            <span className="font-normal normal-case tracking-normal opacity-70">
              (shown on the card and used by Google)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            className={cn(field, "resize-y")}
            placeholder="What is in this week's issue — main sections, notable ads, anything special."
          />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl bg-[rgb(var(--glass-tint)/0.6)] px-4 py-3.5">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked
          className="size-4 accent-[var(--color-violet)]"
        />
        <span className="text-sm font-medium">
          Publish immediately
          <span className="ml-1.5 font-normal text-[rgb(var(--text-muted))]">
            — untick to save it as a draft first
          </span>
        </span>
      </label>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[var(--color-rose)]/10 px-4 py-3 text-sm text-[var(--color-rose)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !file}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
        {busy ? "Working…" : "Publish this issue"}
      </button>
    </form>
  );
}
