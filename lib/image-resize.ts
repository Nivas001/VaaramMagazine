import { AD_FORMATS, type AdFormat } from "@/lib/types";

/**
 * Redraws an advertiser's artwork to the exact size its slot renders at.
 *
 * Two problems this solves, both of which only appear once a page carries
 * twenty advertisements instead of one:
 *
 *   · Weight. Artwork is served straight from object storage — the site turns
 *     Next's image optimiser off deliberately, because these files belong to
 *     advertisers rather than to us. So every byte uploaded is a byte every
 *     visitor downloads. Twenty cards at the 2 MB ceiling would be a forty
 *     megabyte page. Re-encoded to WebP, a 2 MB export lands nearer 60 KB.
 *
 *   · Shape. The output is exactly the format's proportion, so `object-contain`
 *     has nothing to letterbox and a slot never shows bands down its sides.
 *
 * Artwork is fitted inside the frame rather than cropped to fill it: an
 * advertiser paid for this image, and losing a phone number off the edge of it
 * is a far worse outcome than a little background showing.
 *
 * Browser-only. If anything here is unavailable or throws — older Safari is
 * the usual reason — the original file is returned untouched and the upload
 * route's own 2 MB ceiling still applies.
 */
export async function normaliseAdArtwork(file: File, format: AdFormat): Promise<File> {
  const spec = AD_FORMATS[format];

  try {
    if (typeof createImageBitmap !== "function") return file;

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = spec.width;
    canvas.height = spec.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // The surface behind a letterboxed image. White rather than transparent:
    // a transparent PNG over the site's own card background looks like a
    // rendering fault, whereas a white margin reads as part of the artwork.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, spec.width, spec.height);

    const scale = Math.min(spec.width / bitmap.width, spec.height / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, Math.round((spec.width - w) / 2), Math.round((spec.height - h) / 2), w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82)
    );
    if (!blob || blob.size === 0) return file;

    // Should the re-encode somehow come out larger, keep what was uploaded.
    if (blob.size >= file.size && file.type === "image/webp") return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "artwork";
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}
