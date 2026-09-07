import { PublishForm } from "@/components/admin/PublishForm";
import { BentoCard } from "@/components/ui/Bento";

export const dynamic = "force-dynamic";

export default function NewEditionPage() {
  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Publish an issue</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
        Upload the print-ready PDF. Everything else is filled in for you.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <PublishForm />

        <BentoCard glow="cyan" className="p-6" interactive={false}>
          <h2 className="text-base font-bold">What happens when you publish</h2>
          <ol className="mt-4 space-y-3.5 text-sm text-[rgb(var(--text-muted))]">
            {[
              "Your browser reads the PDF to count the pages and render the front page as a cover thumbnail.",
              "The PDF goes straight from your computer into storage — it never passes through the website's server, so there is no file size limit to worry about.",
              "The issue is saved and appears on the home page and in the archive within a minute.",
            ].map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-600),var(--color-fuchsia))] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-2xl bg-[rgb(var(--glass-tint)/0.7)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">
              Tip
            </p>
            <p className="mt-1.5 text-sm text-[rgb(var(--text-muted))]">
              Keep the PDF under about 25 MB if you can. Readers on mobile data will thank you, and
              you will fit far more issues in free storage.
            </p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
