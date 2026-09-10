import Link from "next/link";
import { ExternalLink, FileUp, Pencil } from "lucide-react";
import { adminGetPublications } from "@/lib/admin-queries";
import { deletePublication, togglePublication } from "@/app/admin/actions";
import { editionLabel, formatBytes } from "@/lib/utils";
import { CoverArt } from "@/components/magazine/MagazineCover";
import { RowActions } from "@/components/admin/RowActions";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const publications = await adminGetPublications();

  return (
    <>
      <PageHeader
        title="Issues"
        lead={`${publications.length} edition${publications.length === 1 ? "" : "s"} in total.`}
        action={
          <Link
            href="/admin/issues/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <FileUp className="size-4" aria-hidden />
            Publish an edition
          </Link>
        }
      />

      {publications.length === 0 ? (
        <EmptyState
          title="No editions yet"
          body="Upload your first PDF and it will appear on the site straight away."
          action={
            <Link
              href="/admin/issues/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white"
            >
              <FileUp className="size-4" aria-hidden />
              Publish an edition
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 space-y-3">
          {publications.map((p) => (
            <Panel as="li" key={p.id} className="p-5">
              <div className="flex flex-wrap items-start gap-5">
                <div className="page-stock aspect-[3/4] w-[68px] shrink-0">
                  <CoverArt publication={p} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-semibold">{p.title}</h2>
                    <StatusPill published={p.is_published} />
                  </div>

                  <p className="mt-2 text-[13px] leading-relaxed text-[rgb(var(--text-faint))]">
                    {editionLabel(p.edition_date)}
                    <span className="mx-2" aria-hidden>·</span>
                    {p.total_pages ?? "?"} pages
                    {formatBytes(p.file_size_bytes) && (
                      <>
                        <span className="mx-2" aria-hidden>·</span>
                        {formatBytes(p.file_size_bytes)}
                      </>
                    )}
                    <span className="mx-2" aria-hidden>·</span>
                    {p.view_count ?? 0} views
                    <span className="mx-2" aria-hidden>·</span>
                    {p.download_count ?? 0} downloads
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <RowActions
                      id={p.id}
                      isActive={p.is_published}
                      onToggle={togglePublication}
                      onDelete={deletePublication}
                      activeLabel="Unpublish"
                      inactiveLabel="Publish"
                      confirmLabel="Delete for good"
                    />
                    <Link
                      href={`/admin/issues/${p.id}/edit`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] bg-[rgb(var(--surface))] px-3.5 text-[13px] font-medium text-[rgb(var(--text))] shadow-xs transition-colors hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--accent-text))]"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Link>
                    <a
                      href={`/archives/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--accent-text))]"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      Preview
                    </a>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </ul>
      )}
    </>
  );
}
