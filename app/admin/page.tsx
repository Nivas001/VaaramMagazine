import Link from "next/link";
import { ArrowRight, FileUp, Images, Mail, MessageSquare } from "lucide-react";
import {
  adminGetBanners,
  adminGetEnquiries,
  adminGetPublications,
  adminGetSubscribers,
} from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";
import { isR2Configured } from "@/lib/storage";
import { EmptyState, PageHeader, Panel, Stat, StatusPill, SetupNote } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [publications, banners, enquiries, subscribers] = await Promise.all([
    adminGetPublications(),
    adminGetBanners(),
    adminGetEnquiries(),
    adminGetSubscribers(),
  ]);

  const live = publications.filter((p) => p.is_published);
  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const activeBanners = banners.filter((b) => b.is_active);
  const views = publications.reduce((sum, p) => sum + (p.view_count ?? 0), 0);
  const readers = subscribers.filter((s) => s.is_active);

  return (
    <>
      <PageHeader
        title="Dashboard"
        lead="Everything about the website at a glance."
        action={
          <Link
            href="/admin/issues/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <FileUp className="size-4" aria-hidden />
            Publish this week
          </Link>
        }
      />

      {!isR2Configured() && (
        <SetupNote>
          <strong className="font-semibold">Using Supabase Storage for files.</strong> Uploads
          work, but the free plan allows roughly 5&nbsp;GB of downloads a month. Add your
          Cloudflare R2 keys to <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
          for unlimited free downloads.
        </SetupNote>
      )}

      {/* Five cards: 2-col leaves one orphaned at tablet width, so this skips
          straight from a single mobile column to 3 (3+2) and then 5. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Editions live" value={live.length} hint={`${publications.length} in total`} />
        <Stat label="Edition views" value={views.toLocaleString("en-CA")} />
        <Stat label="New enquiries" value={newEnquiries.length} hint="Waiting for a reply" />
        <Stat label="Banners running" value={activeBanners.length} />
        <Stat label="Readers on the list" value={readers.length} hint="Email subscribers" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/admin/issues/new"
          Icon={FileUp}
          title="Publish an edition"
          body="Upload the PDF and it goes live in about a minute."
        />
        <QuickAction
          href="/admin/enquiries"
          Icon={MessageSquare}
          title="Read enquiries"
          body={
            newEnquiries.length === 0
              ? "Nothing waiting right now."
              : `${newEnquiries.length} waiting for a reply.`
          }
        />
        <QuickAction
          href="/admin/banners"
          Icon={Images}
          title="Manage banners"
          body={`${activeBanners.length} running on the site.`}
        />
        <QuickAction
          href="/admin/subscribers"
          Icon={Mail}
          title="Reader list"
          body={
            readers.length === 0
              ? "Nobody has signed up yet."
              : `${readers.length} waiting for this week's link.`
          }
        />
      </div>

      <h2 className="mt-14 font-display text-2xl tracking-[-0.02em]">Recent editions</h2>

      {publications.length === 0 ? (
        <EmptyState
          title="Nothing published yet"
          body="Upload your first edition and it will appear on the site straight away."
          action={
            <Link
              href="/admin/issues/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white"
            >
              Publish an edition
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {publications.slice(0, 5).map((p) => (
            <Panel as="li" key={p.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="mt-1 text-[13px] text-[rgb(var(--text-faint))]">
                  {formatDate(p.edition_date)}
                  <span className="mx-2" aria-hidden>·</span>
                  {p.view_count ?? 0} views
                  <span className="mx-2" aria-hidden>·</span>
                  {p.download_count ?? 0} downloads
                </p>
              </div>
              <StatusPill published={p.is_published} />
            </Panel>
          ))}
        </ul>
      )}

      {newEnquiries.length > 0 && (
        <>
          <h2 className="mt-14 font-display text-2xl tracking-[-0.02em]">Newest enquiries</h2>
          <ul className="mt-5 space-y-3">
            {newEnquiries.slice(0, 4).map((e) => (
              <Panel as="li" key={e.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-semibold">
                    {e.name}
                    <span className="ml-2.5 font-normal text-[rgb(var(--text-muted))]">
                      {e.phone}
                    </span>
                  </p>
                  <span className="text-[13px] text-[rgb(var(--text-faint))]">
                    {formatDate(e.created_at)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                  {e.message}
                </p>
              </Panel>
            ))}
          </ul>
        </>
      )}
    </>
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
    <Link href={href} className="group">
      <Panel className="h-full p-6 transition-colors group-hover:border-[rgb(var(--text-faint))]">
        <span className="grid size-10 place-items-center rounded-full bg-[rgb(var(--surface-2))] text-[rgb(var(--accent-text))]">
          <Icon className="size-[18px]" />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">{body}</p>
      </Panel>
    </Link>
  );
}
