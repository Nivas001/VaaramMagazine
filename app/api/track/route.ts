import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type SingleType =
  | "publication_view"
  | "publication_download"
  | "banner_impression"
  | "banner_click";

type Body =
  | { type: SingleType; id: string }
  /** A whole side rail's impressions at once. */
  | { type: "banner_impressions"; ids: string[] };

const HANDLERS: Record<SingleType, { fn: string; arg: string }> = {
  publication_view: { fn: "increment_publication_view", arg: "pub_id" },
  publication_download: { fn: "increment_publication_download", arg: "pub_id" },
  banner_impression: { fn: "increment_banner_impression", arg: "banner_id" },
  banner_click: { fn: "increment_banner_click", arg: "banner_id" },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One rail is twenty; anything past this is not a page of advertisements. */
const MAX_BATCH = 50;

/**
 * Counters for issue views/downloads and banner impressions/clicks.
 *
 * These are plain aggregate numbers — no IP, no cookie, no visitor identity is
 * stored, so the site needs no cookie banner. The work happens in a Postgres
 * function so a counter bump is a single atomic statement.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const batch =
    body?.type === "banner_impressions" && Array.isArray(body.ids) ? body.ids : null;

  // These numbers are shown to advertisers, so an open endpoint that increments
  // them is an integrity problem rather than a nuisance. A real reader fires a
  // handful per page view; anything past this is a script.
  //
  // A batch is weighed rather than counted once, so a fifty-id payload cannot
  // buy fifty increments for the price of one. Batching already collapses a
  // twenty-card rail into a single request, which is why the ceiling can be
  // generous without loosening anything.
  const limit = rateLimit(clientKey(request, "track"), {
    limit: 120,
    windowMs: 60 * 1000,
    cost: batch ? Math.ceil(Math.min(batch.length, MAX_BATCH) / 10) : 1,
  });
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  try {
    const supabase = createAdminClient();

    if (batch) {
      // A single malformed id must not cost the nineteen good ones alongside
      // it, so bad entries are dropped rather than failing the whole batch.
      const ids = [...new Set(batch)].filter((id) => UUID.test(id)).slice(0, MAX_BATCH);
      if (ids.length === 0) return new NextResponse(null, { status: 204 });

      const { error } = await supabase.rpc("increment_banner_impressions", {
        banner_ids: ids,
      });
      if (error) console.error("[track] increment_banner_impressions:", error.message);
      return new NextResponse(null, { status: 204 });
    }

    const handler = HANDLERS[body?.type as SingleType];
    const id = (body as { id?: string })?.id;

    if (!handler || !id || !UUID.test(id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await supabase.rpc(handler.fn, { [handler.arg]: id });
    if (error) console.error("[track]", handler.fn, error.message);

    // Always 204: analytics must never surface an error to a reader.
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
