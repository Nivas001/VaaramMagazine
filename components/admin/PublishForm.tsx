"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { siteConfig } from "@/site.config";
import { createPublication } from "@/app/admin/actions";
import { inspectPdf } from "@/lib/pdf-client";
import { putToStorage, requestTicket } from "./UploadToStorage";

/** Supabase Storage refuses anything larger on this plan. */
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Phase = "idle" | "reading" | "uploading-pdf" | "uploading-cover" | "saving" | "done" | "error";

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

/** Sunday of the current week — the natural default for a weekly paper. */
function defaultEditionDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PublishForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** Which of the two submit buttons was pressed. */
  const intent = useRef<"publish" | "draft">("publish");
  const [pageCount, setPageCount] = useState<number | null>(null);

  // Cover image states: auto-extracted from PDF or custom uploaded
  const [autoCoverBlob, setAutoCoverBlob] = useState<Blob | null>(null);
  const [autoCoverPreview, setAutoCoverPreview] = useState<string | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [customCoverPreview, setCustomCoverPreview] = useState<string | null>(null);

  const busy = phase !== "idle" && phase !== "error" && phase !== "done";

  const pickFile = useCallback(async (incoming: File | null) => {
    setError(null);
    setPageCount(null);
    setAutoCoverBlob(null);
    setAutoCoverPreview(null);
    if (!incoming) return;
    if (incoming.type !== "application/pdf") {
      setError("That is not a PDF. Please choose the print-ready PDF of the edition.");
      return;
    }
    if (incoming.size > MAX_PDF_BYTES) {
      setError(
        `That PDF is ${formatBytes(incoming.size)}. The limit is 50 MB — export it at a lower image quality and try again.`
      );
      return;
    }
    setFile(incoming);

    try {
      setPhase("reading");
      const { pageCount: pages, coverBlob } = await inspectPdf(incoming);
      setPageCount(pages);
      if (coverBlob) {
        setAutoCoverBlob(coverBlob);
        setAutoCoverPreview(URL.createObjectURL(coverBlob));
      }
    } catch (err) {
      console.warn("[publish] PDF inspection notice:", err);
    } finally {
      setPhase("idle");
    }
  }, []);

  const pickCoverFile = useCallback((incoming: File | null) => {
    setError(null);
    if (!incoming) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(incoming.type)) {
      setError("Custom cover must be a JPG, PNG, or WebP image.");
      return;
    }
    if (incoming.size > MAX_IMAGE_BYTES) {
      setError(`Cover image is ${formatBytes(incoming.size)}. Maximum size is 2 MB.`);
      return;
    }
    setCustomCoverFile(incoming);
    setCustomCoverPreview(URL.createObjectURL(incoming));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the edition PDF first.");
      return;
    }

    // `intent` is set by whichever button was pressed.
    const publishNow = intent.current === "publish";

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
      // 1. Ensure pageCount and auto cover if not already read
      let finalPageCount = pageCount;
      let finalCoverBlob = autoCoverBlob;
      if (finalPageCount === null) {
        setPhase("reading");
        const inspected = await inspectPdf(file);
        finalPageCount = inspected.pageCount;
        finalCoverBlob = inspected.coverBlob;
        setPageCount(finalPageCount);
      }

      // 2. Send the PDF straight to storage.
      setPhase("uploading-pdf");
      const pdfTicket = await requestTicket(file.name, "application/pdf", file.size);
      await putToStorage(pdfTicket, file, setProgress);

      // 3. Send cover: custom file takes priority, otherwise use auto cover blob.
      let coverUrl: string | null = null;
      if (customCoverFile) {
        setPhase("uploading-cover");
        setProgress(0);
        try {
          const coverTicket = await requestTicket(
            customCoverFile.name,
            customCoverFile.type,
            customCoverFile.size
          );
          await putToStorage(coverTicket, customCoverFile, setProgress);
          coverUrl = coverTicket.publicUrl;
        } catch (coverError) {
          console.warn("[publish] custom cover upload failed", coverError);
        }
      } else if (finalCoverBlob) {
        setPhase("uploading-cover");
        setProgress(0);
        try {
          const coverTicket = await requestTicket(
            file.name.replace(/\.pdf$/i, "-cover.jpg"),
            "image/jpeg",
            finalCoverBlob.size
          );
          await putToStorage(coverTicket, finalCoverBlob, setProgress);
          coverUrl = coverTicket.publicUrl;
        } catch (coverError) {
          console.warn("[publish] auto cover upload failed", coverError);
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
        totalPages: finalPageCount,
        coverUrl,
        isPublished: publishNow,
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
      <div className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        </span>
        <h2 className="mt-5 font-display text-2xl tracking-[-0.02em]">
          {intent.current === "publish" ? "Edition published" : "Draft saved"}
        </h2>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-[rgb(var(--text-muted))]">
          {intent.current === "publish"
            ? "It is live now — readers will see it on the home page and in the archive."
            : "Everything is uploaded and hidden. Publish it from the Issues list when you are ready."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setFile(null);
              setPhase("idle");
              setProgress(0);
              setPageCount(null);
            }}
            className="inline-flex h-11 items-center rounded-full bg-[rgb(var(--accent))] px-6 text-sm font-semibold text-white"
          >
            Publish another
          </button>
          <a
            href="/archives"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[rgb(var(--hairline))] inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold"
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
    <form onSubmit={onSubmit} className="rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6 sm:p-8">
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
            ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/8"
            : "border-[rgb(var(--hairline))] hover:border-[rgb(var(--accent))]/60",
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
            <span className="grid size-12 shrink-0 place-items-center rounded-md bg-[rgb(var(--accent))] text-white">
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
                className="ml-2 grid size-8 shrink-0 place-items-center rounded-full text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--accent))]/10 hover:text-[rgb(var(--accent-text))]"
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
            <Loader2 className="size-4 animate-spin text-[rgb(var(--accent-text))]" />
            {phaseLabel[phase]}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-2))]">
            <div
              className="h-full rounded-full bg-[rgb(var(--accent))] transition-[width] duration-200"
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

      {/* ── Cover Thumbnail Section (Optional Custom Artwork) ─────────── */}
      <div className="mt-6 rounded-2xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Cover Thumbnail</h3>
            <p className="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
              {customCoverFile
                ? "Using your custom uploaded cover."
                : file
                ? "Automatically generated from Page 1 of your PDF. You can upload custom artwork if you prefer."
                : "Drop a PDF above to preview the front page, or choose a custom cover image."}
            </p>
          </div>
          {customCoverFile && (
            <button
              type="button"
              onClick={() => {
                setCustomCoverFile(null);
                setCustomCoverPreview(null);
              }}
              className="text-xs font-semibold text-[rgb(var(--accent-text))] underline transition-colors hover:text-wine-strong"
            >
              Use PDF Page 1 instead
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          {/* Live Cover Preview */}
          <div className="page-stock aspect-[3/4] w-[76px] shrink-0 overflow-hidden rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] shadow-xs">
            {customCoverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customCoverPreview}
                alt="Custom cover preview"
                className="size-full object-cover"
              />
            ) : autoCoverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={autoCoverPreview}
                alt="Auto-generated cover preview"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-2 text-center text-[11px] text-[rgb(var(--text-faint))]">
                <ImageIcon className="mb-1 size-5 opacity-40" />
                <span>No cover</span>
              </div>
            )}
          </div>

          <div className="min-w-[200px] flex-1">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickCoverFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 text-xs font-semibold text-[rgb(var(--text))] shadow-xs transition-colors hover:bg-[rgb(var(--surface-3))]"
            >
              <Upload className="size-3.5" />
              {customCoverFile ? "Replace custom cover image" : "Upload custom cover image (optional)"}
            </button>
            <p className="mt-2 text-[11px] text-[rgb(var(--text-faint))]">
              Accepts JPG, PNG or WebP up to 2 MB. If skipped, Page 1 of the PDF is used automatically.
            </p>
          </div>
        </div>
      </div>

      {/* ── Details ───────────────────────────────────────────────────── */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={label}>
            Edition title <span className="text-[rgb(var(--accent-text))]">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            className={field}
            placeholder="e.g. Issue 205"
          />
        </div>

        <div>
          <label htmlFor="edition" className={label}>
            Edition <span className="text-[rgb(var(--accent-text))]">*</span>
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
            Publication date <span className="text-[rgb(var(--accent-text))]">*</span>
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
            placeholder="What is in this week's edition — the main sections, and anything worth calling out."
          />
        </div>
      </div>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-md bg-[rgb(var(--accent))]/10 px-4 py-3 text-sm text-[rgb(var(--accent-text))]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* Two named actions rather than one button and a checkbox: an
          administrator should never have to infer what will happen. */}
      <div className="mt-7 flex flex-col gap-3 border-t border-[rgb(var(--hairline))] pt-6 sm:flex-row">
        <button
          type="submit"
          onClick={() => (intent.current = "publish")}
          disabled={busy || !file}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] text-sm font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-4" aria-hidden />
          )}
          {busy ? "Working…" : "Publish edition"}
        </button>

        <button
          type="submit"
          onClick={() => (intent.current = "draft")}
          disabled={busy || !file}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-6 text-sm font-semibold text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--surface-2))] disabled:opacity-50 sm:flex-none"
        >
          Save as draft
        </button>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[rgb(var(--text-faint))]">
        <strong className="font-semibold text-[rgb(var(--text-muted))]">Publish</strong> puts
        the edition on the home page and in the archive straight away.{" "}
        <strong className="font-semibold text-[rgb(var(--text-muted))]">Save as draft</strong>{" "}
        uploads everything but keeps it hidden until you publish it from the Issues list.
      </p>
    </form>
  );
}
