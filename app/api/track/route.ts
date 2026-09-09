import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Body = {
  type: "publication_view" | "publication_download" | "banner_impression" | "banner_click";
  id: string;
};

const HANDLERS: Record<Body["type"], { fn: string; arg: string }> = {
  publication_view: { fn: "increment_publication_view", arg: "pub_id" },
  publication_download: { fn: "increment_publication_download", arg: "pub_id" },
  banner_impression: { fn: "increment_banner_impression", arg: "banner_id" },
  banner_click: { fn: "increment_banner_click", arg: "banner_id" },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Counters for issue views/downloads and banner impressions/clicks.
 *
 * These are plain aggregate numbers — no IP, no cookie, no visitor identity is
 * stored, so the site needs no cookie banner. The work happens in a Postgres
 * function so a counter bump is a single atomic statement.
 */
export async function POST(request: Request) {
  // These numbers are shown to advertisers, so an open endpoint that increments
  // them is an integrity problem rather than a nuisance. A real reader fires a
  // handful per page view; anything past this is a script.
  const limit = rateLimit(clientKey(request, "track"), {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  try {
    const body = (await request.json()) as Body;
    const handler = HANDLERS[body?.type];

    if (!handler || !body.id || !UUID.test(body.id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.rpc(handler.fn, { [handler.arg]: body.id });
    if (error) console.error("[track]", handler.fn, error.message);

    // Always 204: analytics must never surface an error to a reader.
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
