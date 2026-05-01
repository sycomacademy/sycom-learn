import { userRoleEnum } from "@sycom/db/schema/auth";
import { z } from "zod";
import type { UserRole } from "@sycom/db/schema/auth";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export const adminUserStatusSchema = z.enum(["verified", "banned", "unverified"]);
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

export const listAdminUsersSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(userRoleEnum.enumValues)).optional(),
  statuses: z.array(adminUserStatusSchema).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;
export type SortBy = ListAdminUsersInput["sortBy"];
export type SortDirection = ListAdminUsersInput["sortDirection"];

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

export const banUserSchema = z.object({
  banReason: z.string().check(z.minLength(1, "Ban reason is required"), z.maxLength(500)),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

export const setUserRoleSchema = z.object({
  role: z.enum(["platform_admin", "content_creator", "public_student"]),
});

export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;

export type UserRow = AppRouterOutputs["admin"]["listUsers"]["rows"][number];
export type AdminUserDetails = AppRouterOutputs["admin"]["getUser"];
export type UserStatus = (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG];
