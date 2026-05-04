import { and, eq, gte, isNull, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { course, lesson, section } from "../schema/course";
import { certificate, enrollment, lessonProgress } from "../schema/enrollment";

import type { CourseScope } from "./course";

/** Published catalog scope — mirrors {@link listCatalogCourses} (platform vs active org). */
function buildCatalogScopePredicate(scope: CourseScope, organizationId?: string): SQL {
  if (scope === "platform") {
    return isNull(course.organizationId);
  }
  if (organizationId) {
    return eq(course.organizationId, organizationId);
  }
  return sql`false`;
}

export type StudentDashboardTotals = {
  /** Enrollments that are `active` or `completed` (excludes `dropped`). */
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  certificatesEarned: number;
};

export type StudentEnrollmentDayRow = {
  date: string;
  total: number;
};

export type StudentContinueLearningRow = {
  courseId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  enrollmentStatus: string;
  lastActivityAt: Date | null;
  completedLessonCount: number;
  totalLessonCount: number;
  certificateIssued: boolean;
};

export type GetStudentDashboardOverviewInput = {
  userId: string;
  scope: CourseScope;
  organizationId?: string;
  enrollmentDays: number;
  continueLearningLimit: number;
};

export async function getStudentDashboardOverview(
  database: Database,
  input: GetStudentDashboardOverviewInput,
) {
  const { userId, scope, organizationId, enrollmentDays, continueLearningLimit } = input;
  const scopePred = buildCatalogScopePredicate(scope, organizationId);

  const catalogEnrollmentCourse = and(
    eq(enrollment.userId, userId),
    eq(course.status, "published"),
    scopePred,
  );

  const now = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowStartUtc = new Date(todayUtcMidnight);
  windowStartUtc.setUTCDate(windowStartUtc.getUTCDate() - (enrollmentDays - 1));

  const enrollmentDayBucket = sql`date_trunc('day', ${enrollment.createdAt} AT TIME ZONE 'UTC')::date`;

  const [totalsRow, enrollmentAggRows, continueRows] = await Promise.all([
    database
      .select({
        enrolledCourses: sql<number>`cast(count(*) filter (where ${enrollment.status} <> 'dropped') as int)`,
        completedCourses: sql<number>`cast(count(*) filter (where ${enrollment.status} = 'completed') as int)`,
        inProgressCourses: sql<number>`cast(count(*) filter (where ${enrollment.status} = 'active') as int)`,
        certificatesEarned: sql<number>`cast(count(*) filter (where exists (
          select 1 from ${certificate} where ${certificate.enrollmentId} = ${enrollment.id}
        )) as int)`,
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .where(catalogEnrollmentCourse),
    database
      .select({
        dayKey: sql<string>`${enrollmentDayBucket}::text`,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .where(and(catalogEnrollmentCourse, gte(enrollment.createdAt, windowStartUtc)))
      .groupBy(enrollmentDayBucket),
    database
      .select({
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        imageUrl: course.imageUrl,
        enrollmentStatus: enrollment.status,
        lastActivityAt: enrollment.lastActivityAt,
        completedLessonCount: sql<number>`(
          select count(*)::int
          from ${lessonProgress}
          where ${lessonProgress.enrollmentId} = ${enrollment.id}
            and ${lessonProgress.status} = 'completed'
        )`,
        totalLessonCount: sql<number>`(
          select count(*)::int
          from ${lesson}
          inner join ${section} on ${lesson.sectionId} = ${section.id}
          where ${section.courseId} = ${course.id}
        )`,
        certificateIssued: sql<boolean>`exists(
          select 1 from ${certificate} where ${certificate.enrollmentId} = ${enrollment.id}
        )`,
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .where(and(catalogEnrollmentCourse, eq(enrollment.status, "active")))
      .orderBy(sql`${enrollment.lastActivityAt} desc nulls last`)
      .limit(continueLearningLimit),
  ]);

  const t = totalsRow[0];
  const totals: StudentDashboardTotals = {
    enrolledCourses: t?.enrolledCourses ?? 0,
    completedCourses: t?.completedCourses ?? 0,
    inProgressCourses: t?.inProgressCourses ?? 0,
    certificatesEarned: t?.certificatesEarned ?? 0,
  };

  const enrollmentMap = new Map(enrollmentAggRows.map((row) => [row.dayKey, Number(row.total)]));

  const enrollmentsByDay: StudentEnrollmentDayRow[] = [];
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
    totals,
    enrollmentsByDay,
    continueLearning: continueRows.map((row) => ({
      courseId: row.courseId,
      title: row.title,
      slug: row.slug,
      imageUrl: row.imageUrl,
      enrollmentStatus: row.enrollmentStatus,
      lastActivityAt: row.lastActivityAt,
      completedLessonCount: row.completedLessonCount,
      totalLessonCount: row.totalLessonCount,
      certificateIssued: row.certificateIssued,
    })),
  };
}
