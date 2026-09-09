import { VaaramMark } from "@/components/site/VaaramMark";

/**
 * Shown while a page's data is being fetched.
 *
 * Deliberately not a skeleton of the page below it: an edition page and the
 * archive look nothing alike, and a wrong-shaped skeleton reads worse than an
 * honest pause. The mark breathing is enough to say "working".
 */
export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5">
      <div className="flex flex-col items-center gap-5">
        <VaaramMark className="size-12 animate-pulse" />
        <p className="label-eyebrow text-[rgb(var(--text-faint))]">Loading</p>
      </div>
    </div>
  );
}
