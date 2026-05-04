import { and, desc, eq, gte, isNull, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { course, lesson, section } from "../schema/course";
import { certificate, enrollment, lessonProgress } from "../schema/enrollment";

import type { CourseScope } from "./course";

/**
 * Next lesson in curriculum order: first not completed, otherwise first lesson (e.g. review).
 * Correlates to outer `enrollment` and `course` rows.
 */
function nextLessonIdForEnrollmentSql() {
  return sql<string | null>`
    coalesce(
      (
        select ${lesson.id}
        from ${lesson}
        inner join ${section} on ${lesson.sectionId} = ${section.id}
        left join ${lessonProgress} on ${lessonProgress.lessonId} = ${lesson.id}
          and ${lessonProgress.enrollmentId} = ${enrollment.id}
        where ${section.courseId} = ${course.id}
          and (${lessonProgress.id} is null or ${lessonProgress.status} <> 'completed')
        order by ${section.order} asc, ${lesson.order} asc
        limit 1
      ),
      (
        select ${lesson.id}
        from ${lesson}
        inner join ${section} on ${lesson.sectionId} = ${section.id}
        where ${section.courseId} = ${course.id}
        order by ${section.order} asc, ${lesson.order} asc
        limit 1
      )
    )
  `;
}

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
  /** First incomplete lesson in order, else first lesson; null if course has no lessons. */
  nextLessonId: string | null;
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
        nextLessonId: nextLessonIdForEnrollmentSql(),
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
      nextLessonId: row.nextLessonId,
    })),
  };
}

export type StudentLibrarySectionRow = {
  sectionId: string;
  title: string;
  order: number;
  totalLessonCount: number;
  completedLessonCount: number;
};

export type StudentLibraryCourseRow = {
  courseId: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  difficulty: string;
  enrollmentStatus: string;
  startedAt: Date | null;
  lastActivityAt: Date | null;
  completedLessonCount: number;
  totalLessonCount: number;
  certificateIssued: boolean;
  nextLessonId: string | null;
  sections: StudentLibrarySectionRow[];
};

export type StudentLibraryCertificateRow = {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  certificateNumber: string;
  issuedAt: Date;
};

export type GetStudentLibraryInput = {
  userId: string;
  scope: CourseScope;
  organizationId?: string;
};

export async function getStudentLibrary(database: Database, input: GetStudentLibraryInput) {
  const { userId, scope, organizationId } = input;
  const scopePred = buildCatalogScopePredicate(scope, organizationId);

  const catalogEnrollmentCourse = and(
    eq(enrollment.userId, userId),
    eq(course.status, "published"),
    scopePred,
  );

  const [totalsRow, courseRows, sectionRows, certificateRows] = await Promise.all([
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
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        imageUrl: course.imageUrl,
        difficulty: course.difficulty,
        enrollmentStatus: enrollment.status,
        startedAt: enrollment.startedAt,
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
        nextLessonId: nextLessonIdForEnrollmentSql(),
      })
      .from(enrollment)
      .innerJoin(course, eq(enrollment.courseId, course.id))
      .where(and(catalogEnrollmentCourse, sql`${enrollment.status} <> 'dropped'`))
      .orderBy(sql`${enrollment.lastActivityAt} desc nulls last`),
    database
      .select({
        courseId: section.courseId,
        sectionId: section.id,
        title: section.title,
        order: section.order,
        enrollmentId: enrollment.id,
        totalLessonCount: sql<number>`(
          select count(*)::int
          from ${lesson}
          where ${lesson.sectionId} = ${section.id}
        )`,
        completedLessonCount: sql<number>`(
          select count(*)::int
          from ${lesson}
          inner join ${lessonProgress} on ${lessonProgress.lessonId} = ${lesson.id}
          where ${lesson.sectionId} = ${section.id}
            and ${lessonProgress.enrollmentId} = ${enrollment.id}
            and ${lessonProgress.status} = 'completed'
        )`,
      })
      .from(section)
      .innerJoin(course, eq(section.courseId, course.id))
      .innerJoin(enrollment, eq(enrollment.courseId, course.id))
      .where(and(catalogEnrollmentCourse, sql`${enrollment.status} <> 'dropped'`))
      .orderBy(section.courseId, section.order),
    database
      .select({
        certificateId: certificate.id,
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
      })
      .from(certificate)
      .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
      .innerJoin(course, eq(certificate.courseId, course.id))
      .where(catalogEnrollmentCourse)
      .orderBy(desc(certificate.issuedAt)),
  ]);

  const t = totalsRow[0];
  const totals: StudentDashboardTotals = {
    enrolledCourses: t?.enrolledCourses ?? 0,
    completedCourses: t?.completedCourses ?? 0,
    inProgressCourses: t?.inProgressCourses ?? 0,
    certificatesEarned: t?.certificatesEarned ?? 0,
  };

  const sectionsByCourse = new Map<string, StudentLibrarySectionRow[]>();
  for (const row of sectionRows) {
    const list = sectionsByCourse.get(row.courseId) ?? [];
    list.push({
      sectionId: row.sectionId,
      title: row.title,
      order: row.order,
      totalLessonCount: row.totalLessonCount,
      completedLessonCount: row.completedLessonCount,
    });
    sectionsByCourse.set(row.courseId, list);
  }

  return {
    totals,
    courses: courseRows.map<StudentLibraryCourseRow>((row) => ({
      courseId: row.courseId,
      title: row.title,
      slug: row.slug,
      description: row.description,
      imageUrl: row.imageUrl,
      difficulty: row.difficulty,
      enrollmentStatus: row.enrollmentStatus,
      startedAt: row.startedAt,
      lastActivityAt: row.lastActivityAt,
      completedLessonCount: row.completedLessonCount,
      totalLessonCount: row.totalLessonCount,
      certificateIssued: row.certificateIssued,
      nextLessonId: row.nextLessonId,
      sections: sectionsByCourse.get(row.courseId) ?? [],
    })),
    certificates: certificateRows.map<StudentLibraryCertificateRow>((row) => ({
      certificateId: row.certificateId,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      courseSlug: row.courseSlug,
      certificateNumber: row.certificateNumber,
      issuedAt: row.issuedAt,
    })),
  };
}
