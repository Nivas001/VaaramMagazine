"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Kept in step with the ceiling the upload route enforces. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Validates one chosen file, and says why in a sentence an administrator can
 * act on rather than a code. Returns the problem, or null when it is fine.
 */
export function artworkProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Artwork must be a JPG, PNG or WebP image. A PDF or an AI file cannot be shown on a web page — export a picture of it first.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name} is ${formatBytes(file.size)}. Artwork must be under 2 MB — export it again at a lower quality and try once more.`;
  }
  return null;
}

/**
 * The artwork slot: drop a file on it, pick one, see it, or take it back out.
 *
 * The file input is reset to empty on every change. Without that, clearing an
 * image and then choosing *the same file again* fires no change event at all —
 * the input's value has not changed — and the zone sits there looking broken.
 */
export function UploadZone({
  title = "Advertisement image",
  size,
  file,
  preview,
  busy,
  onPick,
  onClear,
  className,
}: {
  title?: string;
  size: string;
  file: File | null;
  preview: string | null;
  busy: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    if (busy) return;
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onPick(dropped);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        "rounded-md border p-3 transition-colors",
        preview
          ? "border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))]/50"
          : "border-dashed border-[rgb(var(--hairline))] hover:border-[rgb(var(--accent))]/45",
        busy && "pointer-events-none opacity-60",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="text-[11px] tabular-nums text-[rgb(var(--text-faint))]">
          {size} · JPG, PNG or WebP · under 2 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const chosen = e.target.files?.[0] ?? null;
          // Cleared immediately so re-choosing the same file still fires.
          e.target.value = "";
          onPick(chosen);
        }}
      />

      {preview ? (
        <div className="mt-2.5 flex items-center gap-3">
          {/* A local object URL for the file just chosen. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-12 w-20 shrink-0 rounded border border-[rgb(var(--hairline))] object-contain"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-[rgb(var(--text-muted))]">
            {file?.name}
            <span className="mx-1.5" aria-hidden>
              ·
            </span>
            {formatBytes(file?.size ?? 0)}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 text-[12px] font-semibold text-[rgb(var(--accent-text))] underline underline-offset-4"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onClear}
            className="grid size-7 shrink-0 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
            aria-label="Remove artwork"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2.5 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[rgb(var(--hairline))] px-4 text-[13px] font-medium text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--surface-2))]"
        >
          <ImagePlus className="size-3.5" aria-hidden />
          Choose image
          <span className="text-[rgb(var(--text-faint))]">or drop it here</span>
        </button>
      )}
    </div>
  );
}
