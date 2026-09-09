import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * "Tell me when the new edition is out."
 *
 * The row is written with the service-role key because Row Level Security
 * keeps `subscribers` unreadable and unwritable by the public — a visitor may
 * add their own address through this route and can never read the list.
 *
 * Re-subscribing an address that already exists reactivates the existing row
 * rather than failing on the unique index, and the response is identical
 * either way: telling a stranger whether an address is already on the list
 * would leak the list one address at a time.
 */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "subscribe"), {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a lot of sign-ups. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — silently accept so the bot does not learn it was caught.
  if (typeof payload.company_website === "string" && payload.company_website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const email = String(payload.email ?? "").trim().toLowerCase().slice(0, 190);
  const source = String(payload.source ?? "home").trim().slice(0, 40) || "home";

  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("subscribers")
      .upsert(
        { email, source, is_active: true, unsubscribed_at: null },
        { onConflict: "email" }
      );
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("[subscribe]", error);
    return NextResponse.json(
      { error: "We could not save that just now. Please try again in a moment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
