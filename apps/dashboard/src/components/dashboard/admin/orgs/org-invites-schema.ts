import { organizationRoleEnum } from "@sycom/db/schema/auth";
import { z } from "zod";

export const organizationInvitationFilterStatusSchema = z.enum(["accepted", "expired", "rejected"]);
export type OrganizationInvitationFilterStatus = z.infer<
  typeof organizationInvitationFilterStatusSchema
>;

export const listOrgInvitesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(organizationRoleEnum.enumValues)).optional(),
  statuses: z.array(organizationInvitationFilterStatusSchema).optional(),
  sortBy: z.enum(["email", "createdAt", "expiresAt", "organizationName"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrgInvitesInput = z.infer<typeof listOrgInvitesSchema>;
