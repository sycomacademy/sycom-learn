import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const listAdminOrganizationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name", "slug", "createdAt", "memberCount", "owner"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAdminOrganizationsInput = z.infer<typeof listAdminOrganizationsSchema>;
export type OrganizationSortField = ListAdminOrganizationsInput["sortBy"];
export type OrganizationRow = AppRouterOutputs["admin"]["listOrganizations"]["rows"][number];

const RESERVED_ORGANIZATION_SLUGS = [
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "public",
  "www",
] as const;

const slugPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const createOrganizationSchema = z.object({
  name: z.string().check(z.minLength(1, "Organization name is required"), z.maxLength(120)),
  slug: z.string().check(
    z.minLength(2, "Slug must be at least 2 characters"),
    z.maxLength(63, "Slug must be at most 63 characters"),
    z.regex(slugPattern, "Use lowercase letters, numbers, and hyphens only"),
    z.refine((value) => !value.includes("--"), "No consecutive hyphens"),
    z.refine(
      (value) =>
        !RESERVED_ORGANIZATION_SLUGS.includes(
          value as (typeof RESERVED_ORGANIZATION_SLUGS)[number],
        ),
      "This slug is reserved",
    ),
  ),
  ownerFirstName: z.string().check(z.minLength(1, "Owner first name is required"), z.maxLength(80)),
  ownerLastName: z.string().check(z.minLength(1, "Owner last name is required"), z.maxLength(80)),
  ownerEmail: z.email("Enter a valid email"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export const DEFAULT_CREATE_ORGANIZATION_VALUES: CreateOrganizationInput = {
  name: "",
  slug: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
};
