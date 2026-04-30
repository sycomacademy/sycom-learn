import type { OrganizationRole } from "@sycom/db/schema/auth";

import type { OrganizationInvitationFilterStatus } from "./org-invites-schema";

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

export const ORG_ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};
