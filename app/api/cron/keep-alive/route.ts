import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
/** A cached response would defeat the entire point of this route. */
export const dynamic = "force-dynamic";

/**
 * ─── Keeping the database awake ───────────────────────────────────────────
 * Supabase pauses a free project after seven days with no database activity,
 * and a paused database takes the whole website down until somebody un-pauses
 * it by hand. Ordinary visitor traffic already prevents that — every public
 * page is server-rendered and queries Postgres on each request — so this is
 * insurance against a genuinely silent week.
 *
 * It is the *second* such insurance. A GitHub Actions workflow does the same
 * thing daily. The two are deliberately independent, because each has a
 * failure mode the other does not:
 *
 *   · GitHub disables a scheduled workflow after 60 days of repository
 *     inactivity — precisely the quiet spell in which it matters.
 *   · A Vercel cron stops if the project is paused or the deployment is
 *     rolled back.
 *
 * Neither is likely. Both at once is much less likely, and the whole thing
 * costs one request a day.
 *
 * ─── Why this is safe to leave reachable ──────────────────────────────────
 * It reads a single id from `publications`, using the public key, through the
 * same Row Level Security every visitor is subject to. That row is already
 * readable by anyone — it is on the archive page. So the worst an attacker
 * gains by calling this is the thing they could already do by loading the
 * site, which is why the secret below is a guard against wasted invocations
 * rather than against disclosure.
 * ──────────────────────────────────────────────────────────────────────────
 */
/**
 * Whether this is Vercel's own scheduler calling.
 *
 * Vercel sets `x-vercel-cron-schedule` on a cron invocation. A client could
 * forge that header, so this is emphatically *not* an authentication check —
 * it only decides whether the rate limit applies, and the thing being guarded
 * is one public row that any visitor can already read.
 *
 * It matters because of how the limiter keys its buckets. `clientKey` falls
 * back to the literal string "unknown" when a request carries no
 * `x-forwarded-for`, which is exactly the shape of an internally originated
 * cron invocation — so the scheduler would share a single four-per-hour
 * bucket with every other unidentifiable request, and could be throttled into
 * silence. A keep-alive that gets rate limited is worse than no keep-alive at
 * all, because it fails quietly.
 *
 * Setting CRON_SECRET makes this moot: the branch above never reaches here.
 */
function isVercelCron(request: Request) {
  return request.headers.get("x-vercel-cron-schedule") !== null;
}

export async function GET(request: Request) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` on every cron
  // invocation once that variable is set on the project. When it is set we
  // insist on it; when it is not, the route still works, because a keep-alive
  // that refuses to run is worse than one anybody can call.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } else if (!isVercelCron(request)) {
    // Unsecured, so at least make it uninteresting to hammer. The cron itself
    // is exempted above — see why in the note on isVercelCron.
    const limit = rateLimit(clientKey(request, "cron"), {
      limit: 4,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }
  }

  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) {
    console.error("[cron/keep-alive] Supabase is not configured.");
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const startedAt = Date.now();

  try {
    // A plain REST call rather than the Supabase client, for the same reason
    // the GitHub workflow uses curl: the point is to prove the database
    // answers, so the fewer layers between this and Postgres the better. The
    // server client would also read cookies, which this has no use for.
    const response = await fetch(
      `${url}/rest/v1/publications?select=id&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!response.ok) {
      // A non-2xx here is the interesting case: an expired key, or a project
      // that has already paused. Say so loudly rather than reporting success.
      const detail = (await response.text()).slice(0, 200);
      console.error(
        `[cron/keep-alive] Supabase answered ${response.status}: ${detail}`
      );
      return NextResponse.json(
        { ok: false, status: response.status },
        { status: 502 }
      );
    }

    const rows = (await response.json()) as unknown[];
    const ms = Date.now() - startedAt;
    console.log(`[cron/keep-alive] ok — ${rows.length} row(s) in ${ms}ms`);

    return NextResponse.json({
      ok: true,
      rows: rows.length,
      ms,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/keep-alive] failed:", error);
    return NextResponse.json({ ok: false, error: "Ping failed." }, { status: 502 });
  }
}
