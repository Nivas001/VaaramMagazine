import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { siteConfig } from "@/site.config";

export const runtime = "nodejs";

const MAX = { name: 120, email: 160, phone: 30, subject: 160, message: 4000 };

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Enquiries are written to Postgres first — that is the record of truth and it
 * is what the admin dashboard reads. The email notification is best-effort:
 * if Web3Forms is not configured, or is down, the enquiry is still safe.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — silently accept so the bot does not learn it was caught.
  if (clean(payload.company_website, 100)) {
    return NextResponse.json({ ok: true });
  }

  const enquiry = {
    name: clean(payload.name, MAX.name),
    email: clean(payload.email, MAX.email) || null,
    phone: clean(payload.phone, MAX.phone),
    edition: clean(payload.edition, 60) || null,
    category: clean(payload.category, 120) || null,
    subject: clean(payload.subject, MAX.subject),
    message: clean(payload.message, MAX.message),
    source: clean(payload.source, 40) || "contact",
  };

  if (!enquiry.name || !enquiry.phone || !enquiry.subject || !enquiry.message) {
    return NextResponse.json(
      { error: "Please fill in your name, phone number, subject and message." },
      { status: 400 }
    );
  }

  if (enquiry.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(enquiry.email)) {
    return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("enquiries").insert(enquiry);
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("[contact] save failed:", error);
    return NextResponse.json(
      {
        error: `We could not save that. Please call us on ${siteConfig.contact.phone} instead.`,
      },
      { status: 500 }
    );
  }

  // Optional email copy.
  const key = process.env.WEB3FORMS_ACCESS_KEY;
  if (key) {
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...enquiry,
          access_key: key,
          from_name: `${siteConfig.name} website`,
          // Overrides the plain `subject` above so the inbox shows context.
          subject: `New enquiry: ${enquiry.subject}`,
        }),
      });
    } catch (error) {
      console.error("[contact] email notification failed (enquiry was saved):", error);
    }
  }

  return NextResponse.json({ ok: true });
}
