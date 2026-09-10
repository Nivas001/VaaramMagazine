import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { adminGetPublicationById } from "@/lib/admin-queries";
import { EditIssueForm } from "@/components/admin/EditIssueForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const publication = await adminGetPublicationById(id);

  if (!publication) {
    notFound();
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/admin/issues"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
        >
          <ArrowLeft className="size-3.5" />
          Back to all issues
        </Link>
      </div>

      <PageHeader
        title={`Edit: ${publication.title}`}
        lead="Update edition details, replace or customize the cover thumbnail, or adjust publication status."
        action={
          <a
            href={`/archives/${publication.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[rgb(var(--hairline))] px-4 text-xs font-semibold text-[rgb(var(--text))] shadow-xs transition-colors hover:bg-[rgb(var(--surface-3))] hover:text-[rgb(var(--accent-text))]"
          >
            <ExternalLink className="size-3.5" />
            Preview live
          </a>
        }
      />

      <div className="mt-8 max-w-4xl">
        <EditIssueForm publication={publication} />
      </div>
    </>
  );
}
