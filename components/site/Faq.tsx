import { Plus } from "lucide-react";
import { JsonLd } from "@/components/site/JsonLd";
import { Reveal } from "@/components/ui/Reveal";

export type FaqItem = { question: string; answer: string };

/**
 * The questions an advertiser or a reader actually asks before they get in
 * touch — answered on the page, so the phone call can start further along.
 *
 * Built on <details>/<summary> rather than JavaScript state: it opens with the
 * browser's own disclosure behaviour, it is keyboard-operable and announced
 * correctly with no ARIA of our own, it works before hydration, and a reader
 * using in-page find can search text inside a closed panel.
 */
export function Faq({ items, id = "faq" }: { items: FaqItem[]; id?: string }) {
  return (
    <div id={id}>
      <ul className="border-t border-[rgb(var(--hairline))]">
        {items.map((item, i) => (
          <Reveal as="li" key={item.question} delay={i * 0.04}>
            <details className="group border-b border-[rgb(var(--hairline))]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="font-display text-[21px] leading-snug tracking-[-0.02em] transition-colors group-hover:text-[rgb(var(--accent-text))] sm:text-[23px]">
                  {item.question}
                </h3>
                <span
                  aria-hidden
                  className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-[rgb(var(--hairline))] text-[rgb(var(--text-muted))] transition-transform duration-300 group-open:rotate-45"
                >
                  <Plus className="size-3.5" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-12 text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
                {item.answer}
              </p>
            </details>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

/**
 * The same questions, published as structured data.
 *
 * Search engines show these directly in results, which is worth having — but
 * only while the markup matches what is visible on the page, so both are fed
 * from the same array and never written out twice.
 */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return <JsonLd data={jsonLd} />;
}
