import type { Publication } from "@/lib/types";
import { toDate } from "@/lib/utils";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

/**
 * Four numbers about the publication, every one of them derived from the rows
 * that actually exist.
 *
 * Nothing here is a claim we cannot show: "editions published" counts the
 * archive, "weeks running" measures from the oldest edition to today, and
 * "pages in print" adds up the page counts the PDFs reported when they were
 * uploaded. A stat we cannot compute honestly is simply left out.
 */
export function PublicationStats({ publications }: { publications: Publication[] }) {
  if (publications.length === 0) return null;

  const dates = publications.map((p) => toDate(p.edition_date).getTime());
  const oldest = Math.min(...dates);
  const weeks = Math.max(1, Math.round((Date.now() - oldest) / (7 * 86400000)) + 1);
  const pages = publications.reduce((sum, p) => sum + (p.total_pages ?? 0), 0);

  const stats: { value: string; label: string; hint: string }[] = [
    {
      value: publications.length.toLocaleString("en-CA"),
      label: "Editions published",
      hint: "Every one still online",
    },
    {
      value: weeks.toLocaleString("en-CA"),
      label: "Weeks running",
      hint: "One edition each week",
    },
    ...(pages > 0
      ? [
          {
            value: pages.toLocaleString("en-CA"),
            label: "Pages of advertising",
            hint: "Across the whole archive",
          },
        ]
      : []),
    { value: "$0", label: "Cost to read", hint: "No account, no paywall" },
  ];

  return (
    <RevealGroup
      as="ul"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--hairline))] lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <RevealItem as="li" key={stat.label} className="bg-[rgb(var(--surface-3))] p-6 sm:p-7">
          <p className="font-display text-[38px] leading-none tracking-[-0.035em] text-[rgb(var(--accent-text))] tabular-nums sm:text-[46px]">
            {stat.value}
          </p>
          <p className="mt-4 text-[15px] font-semibold text-[rgb(var(--text))]">{stat.label}</p>
          <p className="mt-1 text-[13px] text-[rgb(var(--text-faint))]">{stat.hint}</p>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
