import { PublishForm } from "@/components/admin/PublishForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STEPS = [
  "Your browser reads the PDF to count the pages and render the front page as the cover.",
  "The PDF goes straight from your computer into storage — it never passes through this website's server, so there is no file size limit to work around.",
  "The edition is saved. Publishing it puts it on the home page and in the archive within a minute.",
];

export default function NewIssuePage() {
  return (
    <>
      <PageHeader
        title="Publish an edition"
        lead="Upload the print-ready PDF. Everything else is filled in for you."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <PublishForm />

        <Panel className="p-6">
          <h2 className="font-semibold">What happens when you publish</h2>
          <ol className="mt-5 space-y-4 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
            {STEPS.map((line, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[rgb(var(--surface-2))] text-[11px] font-bold text-[rgb(var(--accent))]">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-md bg-[rgb(var(--surface-2))] p-4">
            <p className="label-eyebrow text-[rgb(var(--text-faint))]">Tip</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text-muted))]">
              Keep the PDF under about 25&nbsp;MB where you can. Readers on mobile data will
              thank you, and far more editions fit in free storage.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
