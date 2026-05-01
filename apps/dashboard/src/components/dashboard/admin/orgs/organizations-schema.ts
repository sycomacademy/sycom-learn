import { z } from "zod";

export const listAdminOrganizationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name", "slug", "createdAt", "memberCount", "owner"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAdminOrganizationsInput = z.infer<typeof listAdminOrganizationsSchema>;
