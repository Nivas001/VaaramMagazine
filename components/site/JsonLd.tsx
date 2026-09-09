/**
 * Structured data, written safely.
 *
 * `JSON.stringify` output is injected into a <script> element, and JSON does
 * not escape "<". A publication title or a banner name containing the literal
 * text "</script>" would therefore close the tag early and let whatever
 * followed it run as markup — a stored cross-site-scripting hole reachable by
 * anyone who can write a row.
 *
 * Escaping the three characters that can begin a tag or an entity closes it
 * completely, and a JSON parser reads the escapes back as exactly the same
 * string, so the structured data a search engine sees is unchanged.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
