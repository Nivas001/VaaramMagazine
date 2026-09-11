import { SubscribeForm } from "@/components/site/SubscribeForm";
import { WeekIllustration } from "@/components/ui/Illustration";
import { Reveal } from "@/components/ui/Reveal";

/**
 * A weekly publication only works if readers come back weekly, and the cheapest
 * way to earn that is to offer to remind them. One field, one promise, and the
 * drawing beside it showing exactly what the promise is: one day of the week,
 * marked.
 */
export function SubscribeBand({ source = "home" }: { source?: string }) {
  return (
    <Reveal className="card-quiet overflow-hidden">
      <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.75fr)] lg:gap-16">
        <div>
          <p className="label-eyebrow text-[rgb(var(--label))]">Every week</p>
          <h2 className="display-md mt-4 max-w-lg">
            Get the new edition the moment it is published.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
            Leave your email and we will send you the link each week. No account to
            create, nothing to install.
          </p>

          <div className="mt-7 max-w-lg">
            <SubscribeForm source={source} />
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <WeekIllustration className="max-w-[260px]" />
        </div>
      </div>
    </Reveal>
  );
}
