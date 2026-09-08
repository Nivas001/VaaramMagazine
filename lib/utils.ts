import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "@/site.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Dates are always formatted in the publication's locale (en-CA) and pinned to
 * UTC. Edition dates arrive as plain "YYYY-MM-DD" strings; without the UTC
 * pin, a reader west of Greenwich would see the edition dated a day early.
 */
export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = toDate(value);
  return new Intl.DateTimeFormat(siteConfig.dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(date);
}

/** "6 Sep" — the compact form used on list rows and calendar cells. */
export function formatDateShort(value: string | Date) {
  return formatDate(value, { day: "numeric", month: "short", year: undefined });
}

/** Parses "YYYY-MM-DD" as UTC midnight rather than local midnight. */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
}

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Week of 6 September 2026" — the canonical way an edition is dated. */
export function editionLabel(date: string) {
  return `Week of ${formatDate(date)}`;
}

/** ISO year + week number, used to key editions to calendar weeks. */
export function isoWeek(value: string | Date): { year: number; week: number } {
  const d = toDate(value);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Shift to the Thursday of this week — ISO weeks are defined by their Thursday.
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7));
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return { year: target.getUTCFullYear(), week };
}

/**
 * "This week", "Last week", "3 weeks ago" — used to tell a reader at a glance
 * how current an edition is. Falls back to the date beyond two months.
 */
export function freshness(date: string): string {
  const days = Math.floor((Date.now() - toDate(date).getTime()) / 86400000);
  if (days < 0) return "Upcoming";
  if (days < 7) return "This week";
  if (days < 14) return "Last week";
  if (days < 63) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date, { month: "long", year: "numeric", day: undefined });
}

/** The calendar year of an edition, used by the archive year filter. */
export function editionYear(date: string): number {
  return toDate(date).getUTCFullYear();
}
