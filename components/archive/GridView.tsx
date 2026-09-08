import type { ReactNode } from "react";
import type { Publication } from "@/lib/types";
import { EditionCard } from "@/components/magazine/EditionCard";

/**
 * The default archive view: covers at a size where the artwork can actually be
 * read. Two columns on a phone is deliberate — a magazine archive should look
 * like a shelf, and one edition per screen makes browsing fifty of them a
 * chore.
 *
 * The advertisement arrives as an already-rendered node from the server page.
 * Importing the AdSlot here instead would drag the server-only data layer into
 * the client bundle, because this view is rendered by a client component.
 */
export function GridView({
  publications,
  inlineAd,
}: {
  publications: Publication[];
  inlineAd?: ReactNode;
}) {
  // The advertisement sits after the first full rows, never above the covers.
  const breakpoint = 8;
  const head = inlineAd ? publications.slice(0, breakpoint) : publications;
  const tail = inlineAd ? publications.slice(breakpoint) : [];

  return (
    <>
      <Grid publications={head} priorityCount={4} />
      {tail.length > 0 && (
        <>
          <div className="my-14">{inlineAd}</div>
          <Grid publications={tail} />
        </>
      )}
    </>
  );
}

function Grid({
  publications,
  priorityCount = 0,
}: {
  publications: Publication[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3 xl:grid-cols-4">
      {publications.map((publication, i) => (
        <li key={publication.id} className="h-full">
          <EditionCard publication={publication} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
