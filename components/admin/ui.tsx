import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared admin furniture, so every screen is laid out the same way. */

export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[rgb(var(--hairline))] pb-7">
      <div>
        <h1 className="display-md">{title}</h1>
        {lead && (
          <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
            {lead}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "form";
}) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-[rgb(var(--hairline))] bg-[rgb(var(--surface-3))]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        published
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/14 text-amber-700 dark:text-amber-400"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          published ? "bg-emerald-600 dark:bg-emerald-400" : "bg-amber-600 dark:bg-amber-400"
        )}
        aria-hidden
      />
      {published ? "Live" : "Draft"}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="mt-8 px-8 py-14 text-center">
      <h2 className="font-display text-2xl tracking-[-0.02em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[rgb(var(--text-muted))]">
        {body}
      </p>
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </Panel>
  );
}

/** A single figure on the dashboard. Deliberately plain — these are facts. */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Panel className="p-6">
      <p className="label-eyebrow text-[rgb(var(--text-faint))]">{label}</p>
      <p className="mt-4 font-display text-4xl tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-[13px] text-[rgb(var(--text-faint))]">{hint}</p>}
    </Panel>
  );
}

/** A short banner explaining a setup step that is not finished yet. */
export function SetupNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-lg border border-amber-500/35 bg-amber-500/8 px-5 py-4 text-sm leading-relaxed text-[rgb(var(--text))]">
      {children}
    </div>
  );
}
