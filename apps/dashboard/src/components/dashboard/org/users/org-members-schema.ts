import { organizationRoleEnum, type OrganizationRole } from "@sycom/db/schema/auth";
import { z } from "zod";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export const orgMemberStatusSchema = z.enum(["verified", "banned", "unverified"]);
export type OrgMemberStatus = z.infer<typeof orgMemberStatusSchema>;

export const listOrgMembersSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(organizationRoleEnum.enumValues)).optional(),
  statuses: z.array(orgMemberStatusSchema).optional(),
  sortBy: z.enum(["name", "email", "joinedAt"]).default("joinedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrgMembersInput = z.infer<typeof listOrgMembersSchema>;
export type OrgMembersSortBy = ListOrgMembersInput["sortBy"];

export const ORG_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export const ORG_ROLE_OPTIONS = [
  { value: "owner", label: ORG_ROLE_LABELS.owner },
  { value: "admin", label: ORG_ROLE_LABELS.admin },
  { value: "teacher", label: ORG_ROLE_LABELS.teacher },
  { value: "student", label: ORG_ROLE_LABELS.student },
] as const;

export const ORG_STATUS_LABELS: Record<OrgMemberStatus, string> = {
  verified: "Verified",
  unverified: "Unverified email",
  banned: "Banned",
};

export const ORG_STATUS_CONFIG = {
  verified: { label: ORG_STATUS_LABELS.verified, variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  banned: { label: ORG_STATUS_LABELS.banned, variant: "error" },
} as const;

export function getOrgMemberStatus(member: {
  banned: boolean | null | undefined;
  emailVerified: boolean;
}): keyof typeof ORG_STATUS_CONFIG {
  if (member.banned) return "banned";
  if (!member.emailVerified) return "unverified";
  return "verified";
}

export type OrgMemberRow = AppRouterOutputs["organization"]["listMembers"]["rows"][number];
export type OrgMemberDetails = AppRouterOutputs["organization"]["getMember"];
