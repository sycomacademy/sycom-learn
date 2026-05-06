import type { Table } from "@tanstack/react-table";

import { CoursesFilters } from "@/components/dashboard/course/courses-filters";
import type { CourseRow as PlatformCourseRow } from "@/components/dashboard/course/courses-schema";

import type { OrgCourseRow } from "./org-courses-schema";

export type OrgCoursesFiltersProps = {
  table: Table<OrgCourseRow>;
};

/** Category filter uses platform taxonomy (`course.listCategories`). */
export function OrgCoursesFilters({ table }: OrgCoursesFiltersProps) {
  return <CoursesFilters table={table as Table<PlatformCourseRow>} />;
}
