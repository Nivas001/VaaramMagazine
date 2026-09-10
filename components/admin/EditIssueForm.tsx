"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type { Publication } from "@/lib/types";
import { siteConfig } from "@/site.config";
import { updatePublication } from "@/app/admin/actions";
import { inspectPdf } from "@/lib/pdf-client";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { putToStorage, requestTicket } from "./UploadToStorage";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const field =
  "w-full rounded-md border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 py-3 text-sm outline-none transition-all focus:border-[rgb(var(--accent))] focus:ring-4 focus:ring-[rgb(var(--accent))]/15";
const label =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]";

type Phase = "idle" | "uploading-pdf" | "uploading-cover" | "saving" | "done" | "error";

export function EditIssueForm({ publication }: { publication: Publication }) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState(publication.title);
  const [edition, setEdition] = useState(publication.edition);
  const [editionDate, setEditionDate] = useState(publication.edition_date);
  const [description, setDescription] = useState(publication.description ?? "");
  const [isPublished, setIsPublished] = useState(publication.is_published);

  // Cover image management
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(publication.cover_url);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  // Optional PDF replacement
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [newPdfPages, setNewPdfPages] = useState<number | null>(null);

  // Process & status
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  const pickCover = useCallback((file: File | null) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setError("Cover must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Cover image is ${formatBytes(file.size)}. Limit is 2 MB.`);
      return;
    }
    setNewCoverFile(file);
    setNewCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  }, []);

  const pickPdf = useCallback(async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Replacement file must be a print-ready PDF.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF is ${formatBytes(file.size)}. Limit is 50 MB.`);
      return;
    }
    setNewPdfFile(file);
    try {
      const { pageCount } = await inspectPdf(file);
      setNewPdfPages(pageCount);
    } catch {
      setNewPdfPages(null);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !edition || !editionDate) {
      setError("Title, edition category and date are all required.");
      return;
    }

    setBusyState("saving");
    setError(null);
    setProgress(0);

    try {
      let finalCoverUrl = removeCover ? null : currentCoverUrl;
      let newPdfUrl = undefined;
      let newPdfKey = undefined;
      let newPdfSize = undefined;
      let newPdfTotalPages = undefined;

      // 1. Upload replacement PDF if chosen
      if (newPdfFile) {
        setPhase("uploading-pdf");
        const pdfTicket = await requestTicket(newPdfFile.name, "application/pdf", newPdfFile.size);
        await putToStorage(pdfTicket, newPdfFile, setProgress);
        newPdfUrl = pdfTicket.publicUrl;
        newPdfKey = pdfTicket.objectKey;
        newPdfSize = newPdfFile.size;
        newPdfTotalPages = newPdfPages;
      }

      // 2. Upload replacement cover if chosen
      if (newCoverFile) {
        setPhase("uploading-cover");
        setProgress(0);
        const coverTicket = await requestTicket(newCoverFile.name, newCoverFile.type, newCoverFile.size);
        await putToStorage(coverTicket, newCoverFile, setProgress);
        finalCoverUrl = coverTicket.publicUrl;
      }

      // 3. Update database row
      setPhase("saving");
      const result = await updatePublication(publication.id, {
        title: title.trim(),
        description: description.trim(),
        edition,
        editionDate,
        coverUrl: finalCoverUrl,
        isPublished,
        pdfUrl: newPdfUrl,
        pdfKey: newPdfKey,
        fileSizeBytes: newPdfSize,
        totalPages: newPdfTotalPages,
      });

      if (!result.ok) throw new Error(result.error);

      setPhase("done");
      router.refresh();
      setTimeout(() => {
        router.push("/admin/issues");
      }, 1200);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Failed to save changes. Please try again.");
    }
  }

  function setBusyState(p: Phase) {
    setPhase(p);
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "",
    "uploading-pdf": `Uploading replacement PDF — ${progress}%`,
    "uploading-cover": `Uploading replacement cover — ${progress}%`,
    saving: "Saving changes to database…",
    done: "Changes saved!",
    error: "",
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))] p-6 sm:p-8">
      {/* ── Cover Thumbnail Manager ─────────────────────────────────────── */}
      <div className="rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-6">
        <h3 className="text-sm font-semibold">Cover Thumbnail Artwork</h3>
        <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--text-muted))]">
          View or update the cover displayed across the home page hero, archive grid, and cards.
        </p>

        <div className="mt-5 flex flex-wrap items-start gap-6">
          {/* Active Preview */}
          <div className="page-stock aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] shadow-md">
            {newCoverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newCoverPreview} alt="New cover preview" className="size-full object-cover" />
            ) : !removeCover && currentCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentCoverUrl} alt="Current cover" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-3 text-center text-xs text-[rgb(var(--text-faint))]">
                <ImageIcon className="mb-1.5 size-6 opacity-40" />
                <span>Typographic fallback</span>
              </div>
            )}
          </div>

          <div className="min-w-[220px] flex-1">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickCover(e.target.files?.[0] ?? null)}
            />

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-4 text-xs font-semibold text-[rgb(var(--text))] shadow-xs transition-colors hover:bg-[rgb(var(--surface-3))] disabled:opacity-50"
              >
                <Upload className="size-3.5" />
                {newCoverFile ? "Choose different image" : "Upload new thumbnail image"}
              </button>

              {newCoverFile && (
                <button
                  type="button"
                  onClick={() => {
                    setNewCoverFile(null);
                    setNewCoverPreview(null);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3 text-xs font-medium text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
                >
                  <X className="size-3.5" />
                  Cancel replacement
                </button>
              )}

              {!newCoverFile && currentCoverUrl && !removeCover && (
                <button
                  type="button"
                  onClick={() => setRemoveCover(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3 text-xs font-medium text-[rgb(var(--text-muted))] hover:text-red-500"
                >
                  Remove thumbnail
                </button>
              )}

              {removeCover && (
                <button
                  type="button"
                  onClick={() => setRemoveCover(false)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3 text-xs font-medium text-[rgb(var(--accent-text))] underline"
                >
                  Restore original thumbnail
                </button>
              )}
            </div>

            <p className="mt-3 text-xs text-[rgb(var(--text-faint))]">
              {newCoverFile
                ? `Ready to upload: ${newCoverFile.name} (${formatBytes(newCoverFile.size)}). Will be saved on submit.`
                : "Accepts JPG, PNG or WebP up to 2 MB. Ideal ratio ~3:4."}
            </p>
          </div>
        </div>
      </div>

      {/* ── Metadata Details ─────────────────────────────────────────────── */}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Issue 205"
          />
        </div>

        <div>
          <label htmlFor="edition" className={label}>
            Edition Category <span className="text-[rgb(var(--accent-text))]">*</span>
          </label>
          <select
            id="edition"
            name="edition"
            required
            className={cn(field, "appearance-none")}
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
          >
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
            className={field}
            value={editionDate}
            onChange={(e) => setEditionDate(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={label}>
            Short description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            className={cn(field, "resize-y")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is in this week's edition — main sections, classifieds highlights, and special features."
          />
        </div>

        {/* ── Status Toggle ──────────────────────────────────────────────── */}
        <div className="sm:col-span-2 rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] p-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <div>
              <span className="text-sm font-semibold text-[rgb(var(--text))]">
                Published on the website
              </span>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                When switched on, readers will see this edition in the public archive and on the homepage.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="size-5 rounded border-[rgb(var(--hairline))] accent-[rgb(var(--accent))]"
            />
          </label>
        </div>

        {/* ── Optional PDF Replacement ───────────────────────────────────── */}
        <div className="sm:col-span-2 rounded-xl border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">
                Attached PDF Document
              </h4>
              <p className="mt-1 text-xs text-[rgb(var(--text-faint))]">
                {newPdfFile ? (
                  <span className="font-medium text-[rgb(var(--accent-text))]">
                    New file selected: {newPdfFile.name} ({formatBytes(newPdfFile.size)} · {newPdfPages ?? "?"} pages)
                  </span>
                ) : (
                  <>
                    Current file: {publication.total_pages ?? "?"} pages
                    {publication.file_size_bytes ? ` · ${formatBytes(publication.file_size_bytes)}` : ""}
                  </>
                )}
              </p>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={busy}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-3.5 text-xs font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-3))]"
              >
                <FileText className="size-3.5" />
                {newPdfFile ? "Choose different PDF" : "Replace PDF file"}
              </button>
              {newPdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setNewPdfFile(null);
                    setNewPdfPages(null);
                  }}
                  className="grid size-8 place-items-center rounded-full text-[rgb(var(--text-muted))] hover:text-red-500"
                  aria-label="Cancel PDF replacement"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress ────────────────────────────────────────────────────── */}
      {busy && (
        <div className="mt-6">
          <div className="flex items-center gap-2.5 text-sm font-medium text-[rgb(var(--text-muted))]">
            <Loader2 className="size-4 animate-spin text-[rgb(var(--accent-text))]" />
            {phaseLabel[phase]}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-2))]">
            <div
              className="h-full rounded-full bg-[rgb(var(--accent))] transition-[width] duration-200"
              style={{
                width: phase === "uploading-pdf" || phase === "uploading-cover" ? `${progress}%` : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-md bg-[rgb(var(--accent))]/10 px-4 py-3 text-sm text-[rgb(var(--accent-text))]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {/* ── Success Banner ──────────────────────────────────────────────── */}
      {phase === "done" && (
        <div className="mt-5 flex items-center gap-2.5 rounded-md bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5 shrink-0" />
          Changes saved successfully! Redirecting to Issues…
        </div>
      )}

      {/* ── Action Buttons ──────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--hairline))] pt-6">
        <Link
          href="/admin/issues"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-5 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
        >
          <ArrowLeft className="size-4" />
          Back to Issues
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] px-7 text-sm font-semibold text-white transition-colors hover:bg-wine-strong disabled:opacity-50 shadow-sm"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
