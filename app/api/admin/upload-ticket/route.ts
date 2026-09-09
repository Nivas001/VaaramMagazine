import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadTicket } from "@/lib/storage";

export const runtime = "nodejs";

const MB = 1024 * 1024;

/**
 * Every accepted type carries its own ceiling. Images are capped hard because
 * artwork is served to every visitor exactly as uploaded — one oversized
 * banner would otherwise become everyone's download on every page it appears.
 * Editions are allowed to be large because a print-ready PDF genuinely is.
 */
const ALLOWED: Record<string, { ext: string; folder: string; maxBytes: number }> = {
  // 50 MB matches the Supabase project's own storage ceiling. Accepting more
  // here would let an upload start and then fail against storage mid-transfer,
  // which is a far worse experience than being told up front.
  "application/pdf": { ext: "pdf", folder: "editions", maxBytes: 50 * MB },
  "image/jpeg": { ext: "jpg", folder: "images", maxBytes: 2 * MB },
  "image/png": { ext: "png", folder: "images", maxBytes: 2 * MB },
  "image/webp": { ext: "webp", folder: "images", maxBytes: 2 * MB },
};

/**
 * Hands the admin's browser a short-lived, signed URL so the file goes straight
 * from their computer into object storage. The PDF never travels through this
 * function, which is what keeps big print-ready editions under the ~4.5 MB
 * request limit every serverless host enforces.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You need to sign in first." }, { status: 401 });
  }

  let body: { fileName?: string; contentType?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const spec = ALLOWED[body.contentType ?? ""];
  if (!spec) {
    return NextResponse.json(
      { error: "Only PDF, JPG, PNG and WebP files can be uploaded." },
      { status: 400 }
    );
  }

  // The browser reports the size before it uploads, so an oversized file is
  // refused before a signed URL is ever handed out.
  const size = typeof body.size === "number" ? body.size : 0;
  if (size > spec.maxBytes) {
    return NextResponse.json(
      {
        error: `That file is ${(size / MB).toFixed(1)} MB. The limit for this type is ${Math.round(spec.maxBytes / MB)} MB — please export it smaller and try again.`,
      },
      { status: 413 }
    );
  }

  try {
    const ticket = await createUploadTicket(
      spec.folder,
      body.fileName ?? "upload",
      body.contentType!,
      spec.ext
    );
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[upload-ticket]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare the upload." },
      { status: 500 }
    );
  }
}
