import { Mail, MessageCircle, Phone } from "lucide-react";
import { adminGetEnquiries } from "@/lib/admin-queries";
import { deleteEnquiry, setEnquiryStatus } from "@/app/admin/actions";
import { getEdition } from "@/site.config";
import { formatDate } from "@/lib/utils";
import { BentoCard } from "@/components/ui/Bento";
import { EnquiryActions } from "@/components/admin/EnquiryActions";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const enquiries = await adminGetEnquiries();
  const counts = {
    new: enquiries.filter((e) => e.status === "new").length,
    contacted: enquiries.filter((e) => e.status === "contacted").length,
    closed: enquiries.filter((e) => e.status === "closed").length,
  };

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Enquiries</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        {counts.new} new · {counts.contacted} contacted · {counts.closed} closed
      </p>

      {enquiries.length === 0 ? (
        <BentoCard className="mt-8 p-10 text-center" interactive={false}>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            No enquiries yet. They will appear here the moment someone uses the contact form.
          </p>
        </BentoCard>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {enquiries.map((e) => (
            <BentoCard
              key={e.id}
              glow={e.status === "new" ? "amber" : "violet"}
              className="p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold">{e.name}</h2>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                    {formatDate(e.created_at, { hour: "numeric", minute: "2-digit" })}
                    {e.edition && ` · ${getEdition(e.edition)?.name ?? e.edition} edition`}
                    {e.category && ` · ${e.category}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${e.phone.replace(/\s/g, "")}`}
                    className="glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold"
                  >
                    <Phone className="size-3.5" /> {e.phone}
                  </a>
                  <a
                    href={`https://wa.me/${e.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-xs font-bold text-white"
                  >
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                  {e.email && (
                    <a
                      href={`mailto:${e.email}`}
                      className="glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold"
                    >
                      <Mail className="size-3.5" /> Email
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold">{e.subject}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--text-muted))]">
                {e.message}
              </p>

              <div className="mt-4">
                <EnquiryActions
                  id={e.id}
                  status={e.status}
                  onSetStatus={setEnquiryStatus}
                  onDelete={deleteEnquiry}
                />
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "new" | "contacted" | "closed" }) {
  const styles = {
    new: "bg-[var(--color-amber)]/15 text-[var(--color-amber)]",
    contacted: "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]",
    closed: "bg-[rgb(var(--text)/0.08)] text-[rgb(var(--text-muted))]",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}
