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
  railAds,
}: {
  publications: Publication[];
  inlineAd?: ReactNode;
  /**
   * The side rail, dealt into the covers a group at a time.
   *
   * Only on narrow screens: from `lg` up these same advertisements are already
   * standing in the rail beside this grid, so each node carries `lg:hidden`.
   * Threading them through the covers rather than stacking them all above is
   * what stops a phone meeting a wall of advertising before a single edition.
   */
  railAds?: ReactNode[];
}) {
  // The advertisement sits after the first full rows, never above the covers.
  const breakpoint = 8;
  const head = inlineAd ? publications.slice(0, breakpoint) : publications;
  const tail = inlineAd ? publications.slice(breakpoint) : [];

  if (!railAds || railAds.length === 0) {
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

  return (
    <>
      <Grid publications={head} priorityCount={4} />
      {tail.length > 0 && <div className="my-14">{inlineAd}</div>}
      <ThreadedGrid publications={tail} railAds={railAds} />
    </>
  );
}

/**
 * Never fewer than this many covers between one group of advertisements and
 * the next — two full rows on a phone. Below that the archive stops reading as
 * an archive.
 */
const MIN_COVERS_BETWEEN = 4;

/**
 * The remaining covers with the rail's advertisements dealt in among them.
 *
 * The spacing is worked out from the two counts rather than fixed, so the
 * groups spread evenly whether the archive holds twelve editions or six
 * hundred. Anything still left once the covers run out is appended, so every
 * booked advertisement renders however short the archive happens to be.
 */
function ThreadedGrid({
  publications,
  railAds,
}: {
  publications: Publication[];
  railAds: ReactNode[];
}) {
  const perChunk = Math.max(
    MIN_COVERS_BETWEEN,
    Math.ceil(publications.length / (railAds.length + 1))
  );

  const chunks: Publication[][] = [];
  for (let i = 0; i < publications.length; i += perChunk) {
    chunks.push(publications.slice(i, i + perChunk));
  }

  return (
    <>
      {chunks.map((chunk, i) => (
        <div key={`chunk-${i}`}>
          <Grid publications={chunk} />
          {railAds[i]}
        </div>
      ))}
      {railAds.slice(chunks.length)}
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
