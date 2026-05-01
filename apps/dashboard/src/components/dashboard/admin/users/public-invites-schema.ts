import { z } from "zod";

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
  sortBy: z.enum(["name", "email", "createdAt", "expiresAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPublicInvitesInput = z.infer<typeof listPublicInvitesSchema>;
export type SortField = ListPublicInvitesInput["sortBy"];
