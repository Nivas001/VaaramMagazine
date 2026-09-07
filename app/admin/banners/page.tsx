import { adminGetBanners } from "@/lib/admin-queries";
import { deleteBanner, toggleBanner } from "@/app/admin/actions";
import { BANNER_PLACEMENTS } from "@/lib/types";
import { getEdition } from "@/site.config";
import { formatDate } from "@/lib/utils";
import { BentoCard } from "@/components/ui/Bento";
import { BannerForm } from "@/components/admin/BannerForm";
import { RowActions } from "@/components/admin/RowActions";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await adminGetBanners();

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Ad banners</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        Sponsored images placed between sections of the website.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <BannerForm />
        </div>

        <div className="flex flex-col gap-3">
          {banners.length === 0 ? (
            <BentoCard className="p-10 text-center" interactive={false}>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                No banners yet. Add one and it will appear on the website straight away.
              </p>
            </BentoCard>
          ) : (
            banners.map((b) => {
              const placement = BANNER_PLACEMENTS.find((p) => p.value === b.placement);
              const expired = b.expires_at ? new Date(b.expires_at) < new Date() : false;
              const ctr = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0";

              return (
                <BentoCard key={b.id} glow={b.is_active && !expired ? "cyan" : "violet"} className="p-5">
                  <img
                    src={b.image_url}
                    alt={`Banner for ${b.client_name}`}
                    className="w-full rounded-xl object-cover"
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">{b.client_name}</h2>
                    {expired && (
                      <span className="rounded-full bg-[var(--color-rose)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-rose)]">
                        Expired
                      </span>
                    )}
                    {!b.is_active && (
                      <span className="rounded-full bg-[rgb(var(--text)/0.08)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
                        Hidden
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs text-[rgb(var(--text-muted))]">
                    {placement?.label ?? b.placement}
                    {b.edition && ` · ${getEdition(b.edition)?.name ?? b.edition} only`}
                    {b.expires_at && ` · until ${formatDate(b.expires_at)}`}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    {b.impressions.toLocaleString("en-IN")} views ·{" "}
                    {b.clicks.toLocaleString("en-IN")} clicks · {ctr}% click rate
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
                </BentoCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
