import Link from "next/link";
import { Plus } from "lucide-react";
import { adminGetBanners } from "@/lib/admin-queries";
import { BannersWorkspace } from "@/components/admin/banners/BannersWorkspace";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await adminGetBanners();

  // No empty state here on purpose. A desk with nothing booked is precisely
  // when the map of free inventory is most useful — it is the sales list. The
  // workspace draws every slot as available and the page reads correctly.
  return (
    <>
      <PageHeader
        title="Website ads"
        lead="Every advertisement space sold on the website itself — what is running, what is free, and where each one lands on the page. Separate from the advertisements printed inside the weekly PDF."
        action={
          <Link
            href="/admin/banners/new"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-strong"
          >
            <Plus className="size-4" aria-hidden />
            Book an ad
          </Link>
        }
      />

      <BannersWorkspace banners={banners} />
    </>
  );
}
