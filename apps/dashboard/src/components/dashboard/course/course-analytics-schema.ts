import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const courseAnalyticsSearchSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});
export type CourseAnalyticsSearchInput = z.infer<typeof courseAnalyticsSearchSchema>;
export type CourseAnalyticsSortBy = CourseAnalyticsSearchInput["sortBy"];

export type CourseAnalyticsStudentRow =
  AppRouterOutputs["course"]["listAnalyticsStudents"]["rows"][number];
export type CourseAnalyticsStudentDetail = AppRouterOutputs["course"]["getAnalyticsStudent"];
export type CourseAnalyticsLesson = CourseAnalyticsStudentDetail["articles"][number];

export function getAnalyticsListInput(
  search: CourseAnalyticsSearchInput,
  courseId: string,
): {
  courseId: string;
  limit: number;
  offset: number;
  search?: string;
  sortBy: CourseAnalyticsSortBy;
  sortDirection: "asc" | "desc";
} {
  return {
    courseId,
    limit: search.limit,
    offset: search.offset,
    search: search.search,
    sortBy: search.sortBy,
    sortDirection: search.sortDirection,
  };
}
