import { z } from "zod";

export const platformInvitationFilterStatusSchema = z.enum([
  "accepted",
  "expired",
  "rejected",
  "revoked",
]);
export type PlatformInvitationFilterStatus = z.infer<typeof platformInvitationFilterStatusSchema>;

export const listPublicInvitesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(platformInvitationFilterStatusSchema).optional(),
  sortBy: z.enum(["name", "email", "createdAt", "expiresAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPublicInvitesInput = z.infer<typeof listPublicInvitesSchema>;
