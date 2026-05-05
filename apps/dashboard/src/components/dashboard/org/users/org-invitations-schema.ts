import type { OrganizationRole } from "@sycom/db/schema/auth";
import { z } from "zod";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export const orgInvitationStatusSchema = z.enum(["accepted", "expired", "rejected"]);
export type OrgInvitationFilterStatus = z.infer<typeof orgInvitationStatusSchema>;

export const listOrgInvitationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  statuses: z.array(orgInvitationStatusSchema).optional(),
  sortBy: z.enum(["email", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrgInvitationsInput = z.infer<typeof listOrgInvitationsSchema>;
export type OrgInvitationsSortBy = ListOrgInvitationsInput["sortBy"];

export const ORG_INVITATION_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export const ORG_INVITATION_STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Rejected", variant: "secondary" },
  expired: { label: "Expired", variant: "error" },
} as const;

export type OrgInvitationStatus = keyof typeof ORG_INVITATION_STATUS_CONFIG;

export type OrgInvitationRow = AppRouterOutputs["organization"]["listInvitations"]["rows"][number];
