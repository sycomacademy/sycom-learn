import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const courseMembersSearchSchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type CourseMembersSearchInput = z.infer<typeof courseMembersSearchSchema>;

export const courseMembersPageSize = 20;

export type CourseInstructorRow = AppRouterOutputs["course"]["listCoInstructors"][number];
export type CourseEnrollmentRow = AppRouterOutputs["enrollment"]["listByCourse"]["rows"][number];
export type CourseEnrollmentDetail = AppRouterOutputs["enrollment"]["getEnrollmentDetail"];
export type SeededOrganizationUsageRow =
  AppRouterOutputs["course"]["listSeededOrganizations"]["rows"][number];

export function getCourseMembersListInput(
  search: CourseMembersSearchInput,
  offset: number,
  courseId: string,
) {
  return {
    courseId,
    limit: courseMembersPageSize,
    offset,
    search: search.search,
  };
}
