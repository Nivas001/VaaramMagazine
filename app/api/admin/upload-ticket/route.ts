import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadTicket } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED: Record<string, { ext: string; folder: string }> = {
  "application/pdf": { ext: "pdf", folder: "editions" },
  "image/jpeg": { ext: "jpg", folder: "images" },
  "image/png": { ext: "png", folder: "images" },
  "image/webp": { ext: "webp", folder: "images" },
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

  let body: { fileName?: string; contentType?: string };
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
