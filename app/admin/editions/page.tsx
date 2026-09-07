import Link from "next/link";
import { ExternalLink, FileUp } from "lucide-react";
import { adminGetPublications } from "@/lib/admin-queries";
import { deletePublication, togglePublication } from "@/app/admin/actions";
import { getEdition } from "@/site.config";
import { editionLabel, formatBytes } from "@/lib/utils";
import { BentoCard } from "@/components/ui/Bento";
import { RowActions } from "@/components/admin/RowActions";

export const dynamic = "force-dynamic";

export default async function AdminEditionsPage() {
  const publications = await adminGetPublications();

  return (
    <div className="pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Issues</h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            {publications.length} issue{publications.length === 1 ? "" : "s"} in total.
          </p>
        </div>
        <Link
          href="/admin/editions/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(100deg,var(--color-brand-600),var(--color-fuchsia))] px-5 text-sm font-semibold text-white"
        >
          <FileUp className="size-4" /> Publish an issue
        </Link>
      </div>

      {publications.length === 0 ? (
        <BentoCard className="mt-8 p-10 text-center" interactive={false}>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            No issues yet. Upload your first PDF to get the site started.
          </p>
        </BentoCard>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {publications.map((p) => (
            <BentoCard key={p.id} glow="violet" className="p-5">
              <div className="flex flex-wrap items-start gap-5">
                {p.cover_url ? (
                  <img
                    src={p.cover_url}
                    alt=""
                    className="h-24 w-[72px] shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-24 w-[72px] shrink-0 rounded-xl bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))]" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">{p.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.is_published
                          ? "bg-[var(--color-emerald)]/15 text-[var(--color-emerald)]"
                          : "bg-[var(--color-amber)]/15 text-[var(--color-amber)]"
                      }`}
                    >
                      {p.is_published ? "Live" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-[rgb(var(--text-muted))]">
                    {getEdition(p.edition)?.name ?? p.edition} · {editionLabel(p.edition_date)} ·{" "}
                    {p.total_pages ?? "?"} pages · {formatBytes(p.file_size_bytes)} ·{" "}
                    {p.view_count ?? 0} views · {p.download_count ?? 0} downloads
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <RowActions
                      id={p.id}
                      isActive={p.is_published}
                      onToggle={togglePublication}
                      onDelete={deletePublication}
                      confirmLabel="Delete for good"
                    />
                    <a
                      href={`/editions/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold text-[rgb(var(--text-muted))] transition-colors hover:text-[var(--color-violet)]"
                    >
                      <ExternalLink className="size-3.5" /> View
                    </a>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}
