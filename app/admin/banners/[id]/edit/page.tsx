import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminGetBannerById, adminGetBanners } from "@/lib/admin-queries";
import { placementSpec } from "@/lib/types";
import { EditBookingForm } from "@/components/admin/banners/EditBookingForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [banner, all] = await Promise.all([adminGetBannerById(id), adminGetBanners()]);
  if (!banner) notFound();

  // The preview draws the whole slot, not just this booking — a rail with five
  // cards in it should look like a rail with five cards in it.
  const siblings = all.filter((b) => b.id !== banner.id);

  return (
    <>
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--text-muted))] transition-colors hover:text-[rgb(var(--text))]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All website ads
      </Link>

      <div className="mt-6">
        <PageHeader
          title={banner.client_name}
          lead={`Booked into ${placementSpec(banner.placement).label}. Change where it appears, when it runs, or the artwork itself — the picture on the right follows every change.`}
        />
      </div>

      <EditBookingForm banner={banner} siblings={siblings} />
    </>
  );
}
