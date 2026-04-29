import type { UserRole } from "@sycom/db/schema/auth";
import { getInitials } from "@sycom/ui/lib/string";

import type { AdminUserStatus } from "./users-schema";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Admin",
  content_creator: "Content Creator",
  public_student: "Student",
};

export const ROLE_OPTIONS = [
  { value: "platform_admin", label: ROLE_LABELS.platform_admin },
  { value: "content_creator", label: ROLE_LABELS.content_creator },
  { value: "public_student", label: ROLE_LABELS.public_student },
] as const;

export const STATUS_LABELS: Record<AdminUserStatus, string> = {
  verified: "Verified",
  unverified: "Unverified email",
  banned: "Banned",
};

export const STATUS_CONFIG = {
  verified: { label: STATUS_LABELS.verified, variant: "success" },
  unverified: { label: "Unverified", variant: "warning" },
  banned: { label: STATUS_LABELS.banned, variant: "error" },
} as const;

export function getUserStatus(user: {
  banned: boolean | null | undefined;
  emailVerified: boolean;
}): keyof typeof STATUS_CONFIG {
  if (user.banned) return "banned";
  if (!user.emailVerified) return "unverified";
  return "verified";
}

export function getUserInitials(name: string): string {
  return getInitials(name).slice(0, 2).toUpperCase();
}
