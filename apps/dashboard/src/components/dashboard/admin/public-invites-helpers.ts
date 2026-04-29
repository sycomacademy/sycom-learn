import type { PlatformInvitationFilterStatus } from "./public-invites-schema";

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
