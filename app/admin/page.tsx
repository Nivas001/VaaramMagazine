import Link from "next/link";
import { Eye, FileUp, Images, MessageSquare, Newspaper, TrendingUp } from "lucide-react";
import { adminGetBanners, adminGetEnquiries, adminGetPublications } from "@/lib/admin-queries";
import { getEdition } from "@/site.config";
import { editionLabel, formatDate } from "@/lib/utils";
import { BentoCard } from "@/components/ui/Bento";
import { isR2Configured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [publications, banners, enquiries] = await Promise.all([
    adminGetPublications(),
    adminGetBanners(),
    adminGetEnquiries(),
  ]);

  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const totalViews = publications.reduce((sum, p) => sum + (p.view_count ?? 0), 0);
  const totalDownloads = publications.reduce((sum, p) => sum + (p.download_count ?? 0), 0);

  const cards = [
    { label: "Issues published", value: publications.filter((p) => p.is_published).length, Icon: Newspaper, glow: "violet" as const },
    { label: "Issue views", value: totalViews, Icon: Eye, glow: "cyan" as const },
    { label: "PDF downloads", value: totalDownloads, Icon: TrendingUp, glow: "emerald" as const },
    { label: "New enquiries", value: newEnquiries.length, Icon: MessageSquare, glow: "amber" as const },
  ];

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Dashboard</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        Everything about the website at a glance.
      </p>

      {!isR2Configured() && (
        <div className="mt-6 rounded-2xl border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10 px-5 py-4 text-sm">
          <strong className="font-bold">Using Supabase Storage.</strong> Uploads work, but the free
          plan allows about 5 GB of downloads a month. Add your Cloudflare R2 keys to{" "}
          <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs">.env.local</code> for unlimited
          free downloads — see step 4 of the setup guide.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, glow }) => (
          <BentoCard key={label} glow={glow} className="p-6">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))] text-white">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="text-gradient mt-5 font-display text-4xl font-extrabold tabular-nums">
              {value.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{label}</p>
          </BentoCard>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/admin/editions/new"
          Icon={FileUp}
          title="Publish this week's issue"
          body="Upload the PDF and it goes live in under a minute."
        />
        <QuickAction
          href="/admin/banners"
          Icon={Images}
          title="Manage ad banners"
          body={`${banners.filter((b) => b.is_active).length} banner(s) currently running.`}
        />
        <QuickAction
          href="/admin/enquiries"
          Icon={MessageSquare}
          title="Read enquiries"
          body={`${newEnquiries.length} waiting for a reply.`}
        />
      </div>

      {/* Recent issues */}
      <h2 className="mt-12 text-xl font-bold">Latest issues</h2>
      {publications.length === 0 ? (
        <BentoCard className="mt-4 p-8 text-center" interactive={false}>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Nothing published yet.{" "}
            <Link href="/admin/editions/new" className="font-semibold text-[var(--color-violet)] hover:underline">
              Upload your first issue
            </Link>
            .
          </p>
        </BentoCard>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {publications.slice(0, 5).map((p) => (
            <BentoCard key={p.id} className="flex flex-wrap items-center gap-4 p-5" glow="violet">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{p.title}</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                  {getEdition(p.edition)?.name ?? p.edition} · {editionLabel(p.edition_date)} ·{" "}
                  {p.view_count ?? 0} views · {p.download_count ?? 0} downloads
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  p.is_published
                    ? "bg-[var(--color-emerald)]/15 text-[var(--color-emerald)]"
                    : "bg-[var(--color-amber)]/15 text-[var(--color-amber)]"
                }`}
              >
                {p.is_published ? "Live" : "Draft"}
              </span>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Recent enquiries */}
      {newEnquiries.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-bold">Newest enquiries</h2>
          <div className="mt-4 flex flex-col gap-3">
            {newEnquiries.slice(0, 4).map((e) => (
              <BentoCard key={e.id} className="p-5" glow="amber">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold">
                    {e.name} · <span className="font-normal">{e.phone}</span>
                  </p>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {formatDate(e.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium">{e.subject}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[rgb(var(--text-muted))]">{e.message}</p>
              </BentoCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({
  href,
  Icon,
  title,
  body,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Link href={href}>
      <BentoCard glow="fuchsia" className="h-full p-6">
        <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))] text-white">
          <Icon className="size-5" />
        </span>
        <h3 className="mt-4 text-base font-bold">{title}</h3>
        <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">{body}</p>
      </BentoCard>
    </Link>
  );
}
