import { AlertTriangle, Check, ExternalLink, X } from "lucide-react";
import { siteConfig } from "@/site.config";
import { isR2Configured } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Settings is deliberately read-only.
 *
 * The site's words live in site.config.ts and its credentials live in
 * environment variables — both under version control or in the host's
 * dashboard, where they belong. A form here would either be a lie or a way to
 * edit secrets from a browser. What this page does instead is tell the
 * administrator what is connected and what is still missing.
 */
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * A one-row probe per table. It answers the only question an administrator
   * actually has when something is missing — "have I run schema.sql since the
   * last update?" — and costs three trivial queries on a page nobody loads in
   * a loop.
   */
  const tables = ["publications", "ad_banners", "enquiries", "subscribers"] as const;
  const tableChecks = await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select("id").limit(1);
      // A missing relation is the case worth reporting. Anything else (an RLS
      // refusal, say) still means the table is there.
      const missing = Boolean(error?.message?.includes("schema cache") || error?.code === "42P01");
      return { table, missing };
    })
  );
  const missingTables = tableChecks.filter((t) => t.missing).map((t) => t.table);

  /**
   * The same question asked of the parts of the schema that are not tables.
   *
   * These are the pieces that fail *silently*. A missing table takes a page
   * down and gets noticed within the hour; a missing counter function means
   * every banner view and click is quietly thrown away, and the first anyone
   * knows of it is an advertiser being shown a report of zeroes. So they are
   * probed here, where somebody is already looking for what is not connected.
   *
   * Each probe is a real call made harmless by its arguments — an empty array
   * and an id that matches nothing update no rows — so what is being tested is
   * exactly what the website does, not an approximation of it.
   */
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";
  const featureChecks = await Promise.all([
    (async () => {
      const { error } = await supabase.rpc("increment_banner_impressions", {
        banner_ids: [] as string[],
      });
      return {
        name: "increment_banner_impressions()",
        detail: "Counts banner views. Without it every view is discarded.",
        missing: Boolean(error),
      };
    })(),
    (async () => {
      const { error } = await supabase.rpc("increment_banner_click", { banner_id: NIL_UUID });
      return {
        name: "increment_banner_click()",
        detail: "Counts banner clicks. Without it every click is discarded.",
        missing: Boolean(error),
      };
    })(),
    (async () => {
      const { error } = await supabase.from("ad_banners").select("rotate_seconds").limit(1);
      return {
        name: "ad_banners.rotate_seconds",
        detail:
          "How long each advertisement holds a shared frame. Without it every rotating slot uses the seven-second default and the setting cannot be saved.",
        missing: Boolean(error),
      };
    })(),
  ]);
  const missingFeatures = featureChecks.filter((f) => f.missing);

  const services = [
    {
      name: "Supabase",
      detail: "Database and administrator sign-in",
      ready: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      missing: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    },
    {
      name: "Cloudflare R2",
      detail: "PDF and image storage with free downloads",
      ready: isR2Configured(),
      missing: "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and NEXT_PUBLIC_R2_PUBLIC_URL",
    },
    {
      name: "Email notifications",
      detail: "A copy of each enquiry sent to your inbox",
      ready: Boolean(process.env.WEB3FORMS_ACCESS_KEY),
      missing: "WEB3FORMS_ACCESS_KEY",
      optional: true,
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        lead="What this site is connected to, and where to change it."
      />

      {missingTables.length > 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-500/35 bg-amber-500/8 px-5 py-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>
            <strong className="font-semibold">The database is out of date.</strong> These
            tables are missing:{" "}
            {missingTables.map((t) => (
              <code key={t} className="mr-1.5 rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
                {t}
              </code>
            ))}
            <br />
            Open the Supabase SQL Editor, paste the whole of{" "}
            <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
              supabase/schema.sql
            </code>{" "}
            and press RUN. It is safe to run more than once.
          </span>
        </div>
      )}

      {missingFeatures.length > 0 && (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-500/35 bg-amber-500/8 px-5 py-4 text-sm leading-relaxed">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>
            <strong className="font-semibold">The database is missing part of the schema.</strong>{" "}
            Everything still works, but these are not there:
            <ul className="mt-2 space-y-1.5">
              {missingFeatures.map((feature) => (
                <li key={feature.name}>
                  <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
                    {feature.name}
                  </code>{" "}
                  — {feature.detail}
                </li>
              ))}
            </ul>
            <p className="mt-2.5">
              Open the Supabase SQL Editor, paste the whole of{" "}
              <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
                supabase/schema.sql
              </code>{" "}
              and press RUN. It is safe to run more than once, and it changes nothing
              you have already published.
            </p>
          </span>
        </div>
      )}

      <h2 className="mt-10 font-display text-2xl tracking-[-0.02em]">Connections</h2>
      <ul className="mt-5 space-y-3">
        {services.map((service) => (
          <Panel as="li" key={service.name} className="flex flex-wrap items-center gap-4 p-5">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                service.ready
                  ? "bg-emerald-500/14 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-500/14 text-amber-700 dark:text-amber-400"
              )}
              aria-hidden
            >
              {service.ready ? <Check className="size-4" /> : <X className="size-4" />}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {service.name}
                {service.optional && (
                  <span className="ml-2 text-[13px] font-normal text-[rgb(var(--text-faint))]">
                    optional
                  </span>
                )}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[rgb(var(--text-muted))]">
                {service.ready ? (
                  service.detail
                ) : (
                  <>
                    Not configured. Add{" "}
                    <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
                      {service.missing}
                    </code>{" "}
                    to <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">.env.local</code>.
                  </>
                )}
              </p>
            </div>
          </Panel>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-2xl tracking-[-0.02em]">Signed in as</h2>
      <Panel className="mt-5 p-5">
        <p className="font-semibold">{user?.email}</p>
        <p className="mt-1 text-[13px] text-[rgb(var(--text-muted))]">
          Administrators are invited from the Supabase dashboard. Sign-ups from the login
          page are disabled, so only invited addresses can request a code.
        </p>
      </Panel>

      <h2 className="mt-12 font-display text-2xl tracking-[-0.02em]">Site details</h2>
      <Panel className="mt-5 divide-y divide-[rgb(var(--hairline))]">
        <Row label="Publication name" value={siteConfig.name} />
        <Row label="Tagline" value={siteConfig.tagline} />
        <Row label="Contact email" value={siteConfig.contact.email} />
        <Row label="Contact phone" value={siteConfig.contact.phone} />
        <Row label="Address" value={siteConfig.contact.address} />
      </Panel>

      <p className="mt-5 flex items-start gap-2 text-[13px] leading-relaxed text-[rgb(var(--text-faint))]">
        <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        These come from{" "}
        <code className="rounded bg-[rgb(var(--surface-2))] px-1.5 py-0.5 text-xs">
          site.config.ts
        </code>
        . Editing that one file changes them everywhere on the website.
      </p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 px-5 py-4">
      <span className="label-eyebrow text-[rgb(var(--text-faint))]">{label}</span>
      <span className="text-[15px] text-[rgb(var(--text))]">{value}</span>
    </div>
  );
}
