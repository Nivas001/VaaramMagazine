import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminGetBannerById } from "@/lib/admin-queries";
import { EditBannerForm } from "@/components/admin/EditBannerForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = await adminGetBannerById(id);
  if (!banner) notFound();

  return (
    <>
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All banners
      </Link>

      <div className="mt-6">
        <PageHeader
          title={banner.client_name}
          lead="Change where this advertisement appears, when it runs, or the artwork itself."
        />
      </div>

      <div className="mt-8 max-w-2xl">
        <EditBannerForm banner={banner} />
      </div>
    </>
  );
}
