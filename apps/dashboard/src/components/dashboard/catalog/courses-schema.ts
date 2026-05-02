import {
  COURSE_STATUSES,
  DIFFICULTY_LEVELS,
  type CourseStatus,
  type DifficultyLevel,
} from "@sycom/db/schema/catalog";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const listAdminCoursesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  statuses: z.array(z.enum(COURSE_STATUSES)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  view: z.enum(["list", "cards"]).default("cards"),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "status", "difficulty"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAdminCoursesInput = z.infer<typeof listAdminCoursesSchema>;
export type CourseViewMode = ListAdminCoursesInput["view"];
export type CourseSortField = ListAdminCoursesInput["sortBy"];
export type CourseRow = AppRouterOutputs["catalog"]["list"]["rows"][number];
export type { CourseStatus, DifficultyLevel };

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export const COURSE_STATUS_OPTIONS = COURSE_STATUSES.map((value) => ({
  value,
  label: COURSE_STATUS_LABELS[value],
}));

export const COURSE_STATUS_VARIANTS: Record<CourseRow["status"], "secondary" | "default"> = {
  draft: "secondary",
  published: "default",
};

export const COURSE_DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const createCourseSchema = z.object({
  title: z.string().check(z.minLength(1, "Title is required"), z.maxLength(160)),
  slug: z.string().check(
    z.minLength(2, "Slug must be at least 2 characters"),
    z.maxLength(80, "Slug must be at most 80 characters"),
    z.regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
    z.refine((value) => !value.includes("--"), "No consecutive hyphens"),
  ),
  description: z.string().check(z.maxLength(2000)),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  status: z.enum(COURSE_STATUSES),
});

export type CreateCourseFormInput = z.infer<typeof createCourseSchema>;

export const DEFAULT_CREATE_COURSE_VALUES: CreateCourseFormInput = {
  title: "",
  slug: "",
  description: "",
  difficulty: "beginner",
  status: "draft",
};

export function getCoursesQueryInput(input: ListAdminCoursesInput) {
  const { view: _view, ...queryInput } = input;
  return queryInput;
}
