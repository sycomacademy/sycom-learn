import { organizationRoleEnum } from "@sycom/db/schema/auth";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

function isValidDateTimeString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const isoDateTimeStringSchema = z.string().refine(isValidDateTimeString, "Invalid date-time value");

export const orgInvitesSentRangeSchema = z.object({
  from: isoDateTimeStringSchema.optional(),
  to: isoDateTimeStringSchema.optional(),
});
export type OrgInvitesSentRange = z.infer<typeof orgInvitesSentRangeSchema>;

export const organizationInvitationFilterStatusSchema = z.enum(["accepted", "expired", "rejected"]);
export type OrganizationInvitationFilterStatus = z.infer<
  typeof organizationInvitationFilterStatusSchema
>;

export const ORG_INVITE_STATUS_CONFIG = {
  accepted: { label: "Accepted", variant: "success" },
  expired: { label: "Expired", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Declined", variant: "secondary" },
} as const;

export const ORG_INVITE_STATUS_FILTER_LABELS: Record<OrganizationInvitationFilterStatus, string> = {
  accepted: "Accepted",
  expired: "Expired",
  rejected: "Declined",
};

export const ORG_ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
} as const;

export const listOrgInvitesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(organizationRoleEnum.enumValues)).optional(),
  statuses: z.array(organizationInvitationFilterStatusSchema).optional(),
  sentFrom: isoDateTimeStringSchema.optional(),
  sentTo: isoDateTimeStringSchema.optional(),
  sortBy: z.enum(["email", "createdAt", "organizationName"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrgInvitesInput = z.infer<typeof listOrgInvitesSchema>;
export type OrgInvitesSortField = ListOrgInvitesInput["sortBy"];
export type OrgInviteRow = AppRouterOutputs["admin"]["listOrganizationInvitations"]["rows"][number];

export function getOrgInvitesQueryInput(input: ListOrgInvitesInput) {
  return {
    ...input,
    sentFrom: input.sentFrom ? new Date(input.sentFrom) : undefined,
    sentTo: input.sentTo ? new Date(input.sentTo) : undefined,
  };
}

export function getOrgInvitesSentRangeFilter(
  input: ListOrgInvitesInput,
): OrgInvitesSentRange | undefined {
  if (!input.sentFrom && !input.sentTo) {
    return undefined;
  }

  return {
    from: input.sentFrom,
    to: input.sentTo,
  };
}
