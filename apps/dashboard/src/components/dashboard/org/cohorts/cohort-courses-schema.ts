import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const cohortCoursesPageSize = 20;

export const cohortCoursesSearchSchema = z.object({
  search: z.string().check(z.maxLength(100)).optional(),
  limit: z.number().int().min(1).max(100).default(cohortCoursesPageSize),
  offset: z.number().int().min(0).default(0),
});

export type CohortCoursesSearchInput = z.infer<typeof cohortCoursesSearchSchema>;

export type CohortCourseRow = AppRouterOutputs["organization"]["listCohortCourses"]["rows"][number];

export function getCohortCoursesListInput(input: {
  cohortId: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return {
    cohortId: input.cohortId,
    search: input.search?.trim() || undefined,
    limit: input.limit ?? cohortCoursesPageSize,
    offset: input.offset ?? 0,
  };
}
