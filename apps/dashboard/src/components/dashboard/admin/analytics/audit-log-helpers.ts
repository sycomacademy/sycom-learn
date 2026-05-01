import type { AuditActorTypeFilter } from "./audit-log-schema";

export const ACTOR_TYPE_LABELS: Record<AuditActorTypeFilter, string> = {
  user: "User",
  system: "System",
};

/** Converts a snake_case event type string to a human-readable label. */
export function formatEventLabel(event: string): string {
  return event
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Returns a short relative time string (e.g. "about 2 hours ago"). */
export function timeAgo(date: Date | string | number): string {
  const now = Date.now();
  const then = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `About ${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
