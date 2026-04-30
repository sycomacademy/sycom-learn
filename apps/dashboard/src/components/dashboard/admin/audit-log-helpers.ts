import type { AuditActorTypeFilter } from "./audit-log-schema";

export const ACTOR_TYPE_LABELS: Record<AuditActorTypeFilter, string> = {
  user: "User",
  system: "System",
};

export function formatEventLabel(event: string): string {
  // "admin.user.banned" → "Admin · User · Banned"
  return event
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, " "))
    .join(" · ");
}

export function eventDomain(event: string): string {
  return event.split(".")[0] ?? "other";
}
