import { z } from "zod";

function isValidDateTimeString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const isoDateTimeStringSchema = z.string().refine(isValidDateTimeString, "Invalid date-time value");

export const publicInvitesSentRangeSchema = z.object({
  from: isoDateTimeStringSchema.optional(),
  to: isoDateTimeStringSchema.optional(),
});
export type PublicInvitesSentRange = z.infer<typeof publicInvitesSentRangeSchema>;

export const platformInvitationFilterStatusSchema = z.enum([
  "accepted",
  "expired",
  "rejected",
  "revoked",
]);
export type PlatformInvitationFilterStatus = z.infer<typeof platformInvitationFilterStatusSchema>;

/** Display config for invitation row `status` (includes values not exposed in the filter combobox). */
export const PLATFORM_INVITE_STATUS_CONFIG = {
  accepted: { label: "Accepted", variant: "success" },
  expired: { label: "Expired", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Declined", variant: "secondary" },
  revoked: { label: "Revoked", variant: "outline" },
} as const;

export const PLATFORM_INVITE_FILTER_LABELS: Record<PlatformInvitationFilterStatus, string> = {
  accepted: "Accepted",
  expired: "Expired",
  rejected: "Declined",
  revoked: "Revoked",
};

export const listPublicInvitesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(platformInvitationFilterStatusSchema).optional(),
  sentFrom: isoDateTimeStringSchema.optional(),
  sentTo: isoDateTimeStringSchema.optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPublicInvitesInput = z.infer<typeof listPublicInvitesSchema>;
export type SortField = ListPublicInvitesInput["sortBy"];

export function getPublicInvitesQueryInput(input: ListPublicInvitesInput) {
  return {
    ...input,
    sentFrom: input.sentFrom ? new Date(input.sentFrom) : undefined,
    sentTo: input.sentTo ? new Date(input.sentTo) : undefined,
  };
}

export function getPublicInvitesSentRangeFilter(
  input: ListPublicInvitesInput,
): PublicInvitesSentRange | undefined {
  if (!input.sentFrom && !input.sentTo) {
    return undefined;
  }

  return {
    from: input.sentFrom,
    to: input.sentTo,
  };
}
