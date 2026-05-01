import { COURSE_STATUSES } from "@sycom/db/schema/catalog";
import { z } from "zod";

export const listAdminCoursesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  statuses: z.array(z.enum(COURSE_STATUSES)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "status", "difficulty"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAdminCoursesInput = z.infer<typeof listAdminCoursesSchema>;
