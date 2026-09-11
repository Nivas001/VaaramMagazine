import Link from "next/link";
import { Pencil } from "lucide-react";
import { adminGetBanners } from "@/lib/admin-queries";
import { deleteBanner, toggleBanner } from "@/app/admin/actions";
import { AD_FORMATS, BANNER_PLACEMENTS, placementSpec, type AdBanner } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BannerForm } from "@/components/admin/BannerForm";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await adminGetBanners();

  // Grouped by placement and kept in the catalogue's own order, so the screen
  // reads down the page the way a reader meets the slots: rails, then strips,
  // then the footer.
  const groups = BANNER_PLACEMENTS.map((spec) => ({
    spec,
    rows: banners.filter((b) => b.placement === spec.value),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <PageHeader
        title="Banners"
        lead="Paid placements on the website itself — separate from the advertisements printed inside the weekly PDF."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="lg:sticky lg:top-40">
          <BannerForm />
        </div>

        <div className="space-y-10">
          {groups.length === 0 ? (
            <EmptyState
              title="No banners yet"
              body="Add one and it appears in its placement on the website straight away."
            />
          ) : (
            groups.map(({ spec, rows }) => (
              <section key={spec.value}>
                <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[rgb(var(--hairline))] pb-3">
                  <h2 className="font-semibold">{spec.label}</h2>
                  <p className="text-[12px] text-[rgb(var(--text-faint))]">
                    {rows.filter((b) => b.is_active).length} of {rows.length} showing
                    <span className="mx-2" aria-hidden>·</span>
                    {AD_FORMATS[spec.format].label}
                    {spec.mode !== "carousel" && (
                      <>
                        <span className="mx-2" aria-hidden>·</span>
                        in this order
                      </>
                    )}
                  </p>
                </header>

                <div className="space-y-3">
                  {rows.map((b, i) => (
                    <BannerRow
                      key={b.id}
                      banner={b}
                      position={i + 1}
                      isFirst={i === 0}
                      isLast={i === rows.length - 1}
                      ordered={spec.mode !== "carousel"}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function BannerRow({
  banner: b,
  position,
  isFirst,
  isLast,
  ordered,
}: {
  banner: AdBanner;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  ordered: boolean;
}) {
  const spec = placementSpec(b.placement);
  const now = new Date();
  const expired = b.expires_at ? new Date(b.expires_at) < now : false;
  const scheduled = b.starts_at ? new Date(b.starts_at) > now : false;
  const rate = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0";

  return (
    <Panel className="p-4">
      <div className="flex flex-wrap gap-4 sm:flex-nowrap">
        <div className="flex shrink-0 items-start gap-3">
          {ordered && (
            <span className="mt-1 w-6 shrink-0 text-right font-display text-[15px] tabular-nums text-[rgb(var(--text-faint))]">
              {position}
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.image_url}
            alt={`Banner for ${b.client_name}`}
            className={cn(
              "w-32 shrink-0 rounded border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-2))] object-contain",
              AD_FORMATS[spec.format].className
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{b.client_name}</h3>
            {expired && <Tag tone="warn">Expired</Tag>}
            {scheduled && <Tag tone="info">Scheduled</Tag>}
            {!b.is_active && <Tag tone="mute">Hidden</Tag>}
          </div>

          {(b.starts_at || b.expires_at) && (
            <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">
              {b.starts_at ? `From ${formatDate(b.starts_at)}` : "From now"}
              {b.expires_at ? ` until ${formatDate(b.expires_at)}` : " — no end date"}
            </p>
          )}

          <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">
            {b.impressions.toLocaleString("en-CA")} views
            <span className="mx-2" aria-hidden>·</span>
            {b.clicks.toLocaleString("en-CA")} clicks
            <span className="mx-2" aria-hidden>·</span>
            {rate}% click rate
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {ordered && <MoveButtons id={b.id} isFirst={isFirst} isLast={isLast} />}

            <Link
              href={`/admin/banners/${b.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-3.5 text-[13px] font-semibold transition-colors hover:border-[rgb(var(--text-faint))] hover:bg-[rgb(var(--surface-2))]"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>

            <RowActions
              id={b.id}
              isActive={b.is_active}
              onToggle={toggleBanner}
              onDelete={deleteBanner}
              confirmLabel="Delete banner"
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warn" | "mute" | "info";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        tone === "warn" && "bg-amber-500/14 text-amber-700 dark:text-amber-400",
        tone === "info" && "bg-sky-500/14 text-sky-700 dark:text-sky-400",
        tone === "mute" && "bg-[rgb(var(--text)/0.07)] text-[rgb(var(--text-muted))]"
      )}
    >
      {children}
    </span>
  );
}
