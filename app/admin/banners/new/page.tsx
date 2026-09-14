import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminGetBanners } from "@/lib/admin-queries";
import { BANNER_PLACEMENTS, type BannerPlacement } from "@/lib/types";
import { BookingForm } from "@/components/admin/banners/BookingForm";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ placement?: string }>;
}) {
  const [{ placement }, banners] = await Promise.all([searchParams, adminGetBanners()]);

  // "Book this slot" on the inventory map arrives here with a placement in the
  // URL. Anything unrecognised — or the retired one — is ignored rather than
  // being pre-selected into a slot nothing can be booked into.
  const preset = BANNER_PLACEMENTS.find((p) => p.value === placement && !p.legacy);

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
          title="Book an ad"
          lead="Five steps. The picture on the right shows where this advertisement lands on the real website as you fill the form in."
        />
      </div>

      <BookingForm
        banners={banners}
        initialPlacement={preset?.value as BannerPlacement | undefined}
      />
    </>
  );
}
