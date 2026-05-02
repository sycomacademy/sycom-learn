import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

function isValidDateTimeString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const isoDateTimeStringSchema = z.string().refine(isValidDateTimeString, "Invalid date-time value");

export const auditLogDateRangeSchema = z.object({
  from: isoDateTimeStringSchema.optional(),
  to: isoDateTimeStringSchema.optional(),
});
export type AuditLogDateRange = z.infer<typeof auditLogDateRangeSchema>;

export const auditActorTypeSchema = z.enum(["user", "system"]);
export type AuditActorTypeFilter = z.infer<typeof auditActorTypeSchema>;

export const ACTOR_TYPE_LABELS: Record<AuditActorTypeFilter, string> = {
  user: "User",
  system: "System",
};

export const listAuditLogSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  actorTypes: z.array(auditActorTypeSchema).optional(),
  events: z.array(z.string().min(1)).optional(),
  organizationId: z.string().min(1).optional(),
  dateFrom: isoDateTimeStringSchema.optional(),
  dateTo: isoDateTimeStringSchema.optional(),
  sortBy: z.enum(["createdAt", "event"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAuditLogInput = z.infer<typeof listAuditLogSchema>;
export type AuditLogSortField = ListAuditLogInput["sortBy"];
export type AuditLogRow = AppRouterOutputs["admin"]["listAuditLog"]["rows"][number];

export function getAuditLogQueryInput(input: ListAuditLogInput) {
  return {
    ...input,
    dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
    dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
  };
}

export function getAuditLogDateRangeFilter(
  input: ListAuditLogInput,
): AuditLogDateRange | undefined {
  if (!input.dateFrom && !input.dateTo) {
    return undefined;
  }

  return {
    from: input.dateFrom,
    to: input.dateTo,
  };
}

export function formatEventLabel(event: string): string {
  return event
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
