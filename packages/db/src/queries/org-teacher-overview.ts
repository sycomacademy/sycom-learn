import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";

import type { Database } from "..";
import { course, courseInstructor, type CourseStatus } from "../schema/course";
import { enrollment } from "../schema/enrollment";

export type OrgTeacherDashboardTotals = {
  assignedCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
};

export type OrgTeacherEnrollmentDayRow = {
  date: string;
  total: number;
};

export type OrgTeacherRecentCourseRow = {
  enrollmentCount: number;
  id: string;
  slug: string;
  status: CourseStatus;
  title: string;
  updatedAt: Date;
};

export type GetOrgTeacherOverviewInput = {
  organizationId: string;
  enrollmentDays: number;
  recentCourseLimit: number;
  userId: string;
};

function emptyEnrollmentDays(enrollmentDays: number): OrgTeacherEnrollmentDayRow[] {
  const now = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowStartUtc = new Date(todayUtcMidnight);
  windowStartUtc.setUTCDate(windowStartUtc.getUTCDate() - (enrollmentDays - 1));

  const enrollmentsByDay: OrgTeacherEnrollmentDayRow[] = [];
  for (let i = 0; i < enrollmentDays; i++) {
    const d = new Date(windowStartUtc);
    d.setUTCDate(d.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    enrollmentsByDay.push({ date: `${yyyy}-${mm}-${dd}`, total: 0 });
  }

  return enrollmentsByDay;
}

export async function getOrgTeacherOverview(database: Database, input: GetOrgTeacherOverviewInput) {
  const { organizationId, enrollmentDays, recentCourseLimit, userId } = input;

  const instructedRows = await database
    .select({ courseId: courseInstructor.courseId })
    .from(courseInstructor)
    .innerJoin(course, eq(courseInstructor.courseId, course.id))
    .where(and(eq(courseInstructor.userId, userId), eq(course.organizationId, organizationId)));

  const courseIds = [...new Set(instructedRows.map((row) => row.courseId))];
  if (courseIds.length === 0) {
    return {
      enrollmentsByDay: emptyEnrollmentDays(enrollmentDays),
      recentCourses: [] as OrgTeacherRecentCourseRow[],
      totals: {
        assignedCourses: 0,
        draftCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
      } satisfies OrgTeacherDashboardTotals,
    };
  }

  const now = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowStartUtc = new Date(todayUtcMidnight);
  windowStartUtc.setUTCDate(windowStartUtc.getUTCDate() - (enrollmentDays - 1));

  const enrollmentDayBucket = sql`date_trunc('day', ${enrollment.createdAt} AT TIME ZONE 'UTC')::date`;

  const orgCoursePredicate = and(
    eq(course.organizationId, organizationId),
    eq(courseInstructor.userId, userId),
  );

  const [statusAggRow, enrollmentCountRow, enrollmentAggRows, recentCourseRows] = await Promise.all(
    [
      database
        .select({
          assignedCourses: sql<number>`cast(count(distinct ${course.id}) as int)`,
          draftCourses: sql<number>`cast(count(distinct case when ${course.status} = 'draft' then ${course.id} end) as int)`,
          publishedCourses: sql<number>`cast(count(distinct case when ${course.status} = 'published' then ${course.id} end) as int)`,
        })
        .from(course)
        .innerJoin(courseInstructor, eq(courseInstructor.courseId, course.id))
        .where(orgCoursePredicate),
      database
        .select({ value: count() })
        .from(enrollment)
        .where(inArray(enrollment.courseId, courseIds)),
      database
        .select({
          dayKey: sql<string>`${enrollmentDayBucket}::text`,
          total: sql<number>`cast(count(*) as int)`,
        })
        .from(enrollment)
        .where(
          and(inArray(enrollment.courseId, courseIds), gte(enrollment.createdAt, windowStartUtc)),
        )
        .groupBy(enrollmentDayBucket),
      database
        .select({
          id: course.id,
          slug: course.slug,
          status: course.status,
          title: course.title,
          updatedAt: course.updatedAt,
          enrollmentCount: sql<number>`cast(count(${enrollment.id}) as int)`,
        })
        .from(course)
        .innerJoin(
          courseInstructor,
          and(eq(courseInstructor.courseId, course.id), eq(courseInstructor.userId, userId)),
        )
        .leftJoin(enrollment, eq(enrollment.courseId, course.id))
        .where(eq(course.organizationId, organizationId))
        .groupBy(course.id, course.slug, course.status, course.title, course.updatedAt)
        .orderBy(desc(course.updatedAt))
        .limit(recentCourseLimit),
    ],
  );

  const agg = statusAggRow[0];
  const enrollmentMap = new Map(enrollmentAggRows.map((row) => [row.dayKey, Number(row.total)]));

  const enrollmentsByDay: OrgTeacherEnrollmentDayRow[] = [];
  for (let i = 0; i < enrollmentDays; i++) {
    const d = new Date(windowStartUtc);
    d.setUTCDate(d.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    enrollmentsByDay.push({ date: key, total: enrollmentMap.get(key) ?? 0 });
  }

  return {
    enrollmentsByDay,
    recentCourses: recentCourseRows.map((row) => ({
      enrollmentCount: row.enrollmentCount,
      id: row.id,
      slug: row.slug,
      status: row.status,
      title: row.title,
      updatedAt: row.updatedAt,
    })),
    totals: {
      assignedCourses: agg?.assignedCourses ?? 0,
      draftCourses: agg?.draftCourses ?? 0,
      publishedCourses: agg?.publishedCourses ?? 0,
      totalEnrollments: enrollmentCountRow[0]?.value ?? 0,
    } satisfies OrgTeacherDashboardTotals,
  };
}
