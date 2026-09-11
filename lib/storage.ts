import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * ─── Why presigned uploads? ───────────────────────────────────────────────
 * Serverless hosts cap request bodies at ~4.5 MB. A print-ready newspaper PDF
 * is far bigger than that, so the file must never pass through our own API.
 * Instead the server hands the browser a short-lived, signed upload URL and
 * the browser streams the file straight into object storage.
 *
 * Primary target is Cloudflare R2 (10 GB free, and — crucially — zero charge
 * for downloads, so a viral edition can never produce a bill). If the R2
 * variables are not configured the code transparently falls back to Supabase
 * Storage so the site still works on day one.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const SUPABASE_BUCKET = "media";

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  );
}

let cachedClient: S3Client | null = null;
function r2() {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return cachedClient;
}

/** Turns "Week 42 — Pondicherry.pdf" into "week-42-pondicherry". */
function slugifyFileName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file"
  );
}

export function buildObjectKey(folder: string, fileName: string, extension: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const token = Math.random().toString(36).slice(2, 10);
  return `${folder}/${stamp}-${token}-${slugifyFileName(fileName)}.${extension}`;
}

export type UploadTicket = {
  /** PUT the raw file to this URL. */
  uploadUrl: string;
  /** Storage path to persist alongside the row. */
  objectKey: string;
  /** Permanent public URL used by the site. */
  publicUrl: string;
  /** Headers the browser must send with the PUT. */
  headers: Record<string, string>;
  provider: "r2" | "supabase";
};

export async function createUploadTicket(
  folder: string,
  fileName: string,
  contentType: string,
  extension: string
): Promise<UploadTicket> {
  const objectKey = buildObjectKey(folder, fileName, extension);

  if (isR2Configured()) {
    const uploadUrl = await getSignedUrl(
      r2(),
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: objectKey,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );

    return {
      uploadUrl,
      objectKey,
      publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/$/, "")}/${objectKey}`,
      headers: { "Content-Type": contentType },
      provider: "r2",
    };
  }

  // Fallback: Supabase Storage signed upload URL.
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .createSignedUploadUrl(objectKey);

  if (error || !data) {
    throw new Error(
      `Could not create a Supabase Storage upload URL: ${error?.message ?? "unknown error"}. ` +
        `Make sure a public bucket named "${SUPABASE_BUCKET}" exists.`
    );
  }

  const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectKey);

  return {
    uploadUrl: data.signedUrl,
    objectKey,
    publicUrl: publicData.publicUrl,
    headers: { "Content-Type": contentType },
    provider: "supabase",
  };
}

/**
 * Removes one stored object.
 *
 * Used when a banner is deleted. Advertisements turn over far faster than
 * editions do — a weekly magazine might carry a hundred bookings a year — so
 * unlike a published PDF, their artwork is not worth keeping forever once the
 * booking is gone.
 *
 * Best-effort by design: the caller deletes the database row first and only
 * then calls this, inside a try/catch. Storage failing must never make a
 * successful delete look as though it failed.
 */
export async function deleteObject(objectKey: string): Promise<void> {
  if (!objectKey) return;

  if (isR2Configured()) {
    await r2().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: objectKey,
      })
    );
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([objectKey]);
  if (error) throw new Error(error.message);
}
