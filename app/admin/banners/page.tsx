import { adminGetBanners } from "@/lib/admin-queries";
import { deleteBanner, toggleBanner } from "@/app/admin/actions";
import { BANNER_PLACEMENTS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BannerForm } from "@/components/admin/BannerForm";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await adminGetBanners();

  return (
    <>
      <PageHeader
        title="Banners"
        lead="Paid placements on the website itself — separate from the advertisements printed inside the weekly PDF."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-40">
          <BannerForm />
        </div>

        <div className="space-y-3">
          {banners.length === 0 ? (
            <EmptyState
              title="No banners yet"
              body="Add one and it appears in its placement on the website straight away."
            />
          ) : (
            banners.map((b) => {
              const placement = BANNER_PLACEMENTS.find((p) => p.value === b.placement);
              const expired = b.expires_at ? new Date(b.expires_at) < new Date() : false;
              const rate =
                b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0";

              return (
                <Panel key={b.id} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image_url}
                    alt={`Banner for ${b.client_name}`}
                    className="w-full border-b border-[rgb(var(--hairline))] object-cover"
                  />

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-semibold">{b.client_name}</h2>
                      {expired && <Tag tone="warn">Expired</Tag>}
                      {!b.is_active && <Tag tone="mute">Hidden</Tag>}
                    </div>

                    <p className="mt-2 text-[13px] text-[rgb(var(--text-faint))]">
                      {placement?.label ?? b.placement}
                      {b.expires_at && ` · until ${formatDate(b.expires_at)}`}
                    </p>
                    <p className="mt-1 text-[13px] text-[rgb(var(--text-faint))]">
                      {b.impressions.toLocaleString("en-CA")} views
                      <span className="mx-2" aria-hidden>·</span>
                      {b.clicks.toLocaleString("en-CA")} clicks
                      <span className="mx-2" aria-hidden>·</span>
                      {rate}% click rate
                    </p>

                    <div className="mt-4">
                      <RowActions
                        id={b.id}
                        isActive={b.is_active}
                        onToggle={toggleBanner}
                        onDelete={deleteBanner}
                        confirmLabel="Delete banner"
                      />
                    </div>
                  </div>
                </Panel>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "warn" | "mute" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        tone === "warn"
          ? "bg-amber-500/14 text-amber-700 dark:text-amber-400"
          : "bg-[rgb(var(--text)/0.07)] text-[rgb(var(--text-muted))]"
      )}
    >
      {children}
    </span>
  );
}
