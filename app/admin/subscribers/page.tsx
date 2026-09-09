import { Mail, MailX } from "lucide-react";
import { adminGetSubscribers } from "@/lib/admin-queries";
import { setSubscriberActive } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import { CopyEmailsButton } from "@/components/admin/CopyEmailsButton";
import { SubscriberActions } from "@/components/admin/SubscriberActions";
import { EmptyState, PageHeader, Panel, Stat } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * The reader list.
 *
 * There is no "send a newsletter" button here on purpose: sending bulk email
 * needs a provider, a verified sending domain and a working unsubscribe link,
 * and a half-built send would be worse than none. What this page does is own
 * the list — who is on it, who left, and a one-click copy of the active
 * addresses to paste into whichever mail tool the publication uses.
 */
export default async function AdminSubscribersPage() {
  const subscribers = await adminGetSubscribers();
  const active = subscribers.filter((s) => s.is_active);

  const sinceLastWeek = active.filter(
    (s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000
  );

  return (
    <>
      <PageHeader
        title="Readers"
        lead="People who asked to be told when a new edition goes live."
        action={active.length > 0 ? <CopyEmailsButton emails={active.map((s) => s.email)} /> : null}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="On the list" value={active.length} hint="Active subscriptions" />
        <Stat label="Joined this week" value={sinceLastWeek.length} />
        <Stat
          label="Unsubscribed"
          value={subscribers.length - active.length}
          hint="Kept, so they are not re-added"
        />
      </div>

      {subscribers.length === 0 ? (
        <EmptyState
          title="Nobody has signed up yet"
          body="The sign-up box sits on the home page, the archive and in the footer. Addresses will appear here as readers use it."
        />
      ) : (
        <>
          <h2 className="mt-14 font-display text-2xl tracking-[-0.02em]">
            Every address
          </h2>
          <ul className="mt-5 space-y-3">
            {subscribers.map((subscriber) => (
              <Panel as="li" key={subscriber.id} className="flex flex-wrap items-center gap-4 p-5">
                <span
                  className={
                    subscriber.is_active
                      ? "grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                      : "grid size-9 shrink-0 place-items-center rounded-full bg-[rgb(var(--surface-2))] text-[rgb(var(--text-faint))]"
                  }
                  aria-hidden
                >
                  {subscriber.is_active ? <Mail className="size-4" /> : <MailX className="size-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{subscriber.email}</p>
                  <p className="mt-1 text-[13px] text-[rgb(var(--text-faint))]">
                    Joined {formatDate(subscriber.created_at)}
                    <span className="mx-2" aria-hidden>·</span>
                    via {subscriber.source}
                    {!subscriber.is_active && subscriber.unsubscribed_at && (
                      <>
                        <span className="mx-2" aria-hidden>·</span>
                        left {formatDate(subscriber.unsubscribed_at)}
                      </>
                    )}
                  </p>
                </div>

                <SubscriberActions
                  id={subscriber.id}
                  isActive={subscriber.is_active}
                  onToggle={setSubscriberActive}
                />
              </Panel>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
