import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type { Database } from "..";
import { organization, user } from "../schema/auth";
import {
  category,
  course,
  courseCategory,
  courseInstructor,
  lesson,
  section,
  type DifficultyLevel,
  type InstructorRole,
  type LessonType,
} from "../schema/course";
import { certificate, enrollment } from "../schema/enrollment";

import type { CourseInstructorPreview, CourseScope } from "./course";
import { loadCategoriesForCourses, loadInstructorsForCourses } from "./course";

export type CatalogListCourseRow = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  difficulty: DifficultyLevel;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: Date;
  updatedAt: Date;
  enrolled: boolean;
  lessonCount: number;
  instructors: CourseInstructorPreview[];
  categories: Array<{ id: string; name: string }>;
};

export type ListCatalogCoursesFilter = {
  scope: CourseScope;
  organizationId?: string;
  userId: string;
  search?: string;
  difficulties?: DifficultyLevel[];
  categoryIds?: string[];
  enrolledOnly?: boolean;
  limit: number;
  offset: number;
  sortBy: "title" | "updatedAt" | "difficulty";
  sortDirection: "asc" | "desc";
};

export type ListCatalogCoursesResult = {
  rows: CatalogListCourseRow[];
  totalCount: number;
};

const CATALOG_SORT_COLUMNS = {
  title: course.title,
  updatedAt: course.updatedAt,
  difficulty: course.difficulty,
} as const;

export async function listCatalogCourses(
  database: Database,
  input: ListCatalogCoursesFilter,
): Promise<ListCatalogCoursesResult> {
  const {
    scope,
    organizationId,
    userId,
    search,
    difficulties,
    categoryIds,
    enrolledOnly,
    limit,
    offset,
    sortBy,
    sortDirection,
  } = input;

  const scopePred =
    scope === "platform"
      ? isNull(course.organizationId)
      : organizationId
        ? eq(course.organizationId, organizationId)
        : sql`false`;

  const filters: SQL[] = [scopePred, eq(course.status, "published")];

  if (search) {
    const pattern = `%${search}%`;
    const expr = or(ilike(course.title, pattern), ilike(course.slug, pattern));
    if (expr) filters.push(expr);
  }
  if (difficulties && difficulties.length > 0) {
    filters.push(inArray(course.difficulty, difficulties));
  }
  if (categoryIds && categoryIds.length > 0) {
    filters.push(
      sql`${course.id} in (select ${courseCategory.courseId} from ${courseCategory} where ${inArray(courseCategory.categoryId, categoryIds)})`,
    );
  }

  const enrollmentJoin = and(eq(enrollment.courseId, course.id), eq(enrollment.userId, userId));

  if (enrolledOnly) {
    filters.push(isNotNull(enrollment.id));
  }

  const where = and(...filters);
  const orderColumn = CATALOG_SORT_COLUMNS[sortBy];
  const orderBy = sortDirection === "desc" ? desc(orderColumn) : asc(orderColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: course.id,
        title: course.title,
        slug: course.slug,
        imageUrl: course.imageUrl,
        difficulty: course.difficulty,
        organizationId: course.organizationId,
        organizationName: organization.name,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        enrolled: sql<boolean>`(${enrollment.id} is not null)`,
        lessonCount: sql<number>`(
          select count(*)::int
          from ${lesson}
          inner join ${section} on ${lesson.sectionId} = ${section.id}
          where ${section.courseId} = ${course.id}
        )`,
      })
      .from(course)
      .leftJoin(organization, eq(organization.id, course.organizationId))
      .leftJoin(enrollment, enrollmentJoin)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database
      .select({ value: count() })
      .from(course)
      .leftJoin(organization, eq(organization.id, course.organizationId))
      .leftJoin(enrollment, enrollmentJoin)
      .where(where),
  ]);

  const courseIds = rows.map((row) => row.id);
  const [instructorsByCourse, categoriesByCourse] = await Promise.all([
    loadInstructorsForCourses(database, courseIds),
    loadCategoriesForCourses(database, courseIds),
  ]);

  return {
    rows: rows.map((row) => ({
      ...row,
      instructors: instructorsByCourse.get(row.id) ?? [],
      categories: categoriesByCourse.get(row.id) ?? [],
    })),
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export type CatalogLessonRow = {
  id: string;
  sectionId: string;
  title: string;
  type: LessonType;
  order: number;
  content: unknown;
};

export type CatalogSectionWithLessons = {
  id: string;
  title: string;
  description: string | null;
  openAt: Date | null;
  dueAt: Date | null;
  order: number;
  lessons: CatalogLessonRow[];
};

export type CatalogCourseDetailRaw = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: unknown;
  imageUrl: string | null;
  difficulty: DifficultyLevel;
  organizationId: string | null;
  organizationName: string | null;
  sourceCourseId: string | null;
  certificateSettings: unknown | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  instructors: Array<CourseInstructorPreview & { addedAt: Date }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  sections: CatalogSectionWithLessons[];
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  certificateId: string | null;
};

export async function getCatalogCourseDetail(
  database: Database,
  input: { courseId: string; userId: string },
): Promise<CatalogCourseDetailRaw | null> {
  const { courseId, userId } = input;

  const [courseRow] = await database
    .select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      summary: course.summary,
      imageUrl: course.imageUrl,
      difficulty: course.difficulty,
      organizationId: course.organizationId,
      organizationName: organization.name,
      sourceCourseId: course.sourceCourseId,
      certificateSettings: course.certificateSettings,
      createdBy: course.createdBy,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    })
    .from(course)
    .leftJoin(organization, eq(organization.id, course.organizationId))
    .where(and(eq(course.id, courseId), eq(course.status, "published")))
    .limit(1);

  if (!courseRow) return null;

  const [creatorRows, coInstructorRows, categoryRows, sectionRows, lessonRows, enrollmentRow] =
    await Promise.all([
      database
        .select({
          userId: user.id,
          role: sql<InstructorRole>`'main'`,
          addedAt: course.createdAt,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(course)
        .innerJoin(user, eq(user.id, course.createdBy))
        .where(eq(course.id, courseId))
        .limit(1),
      database
        .select({
          userId: courseInstructor.userId,
          role: courseInstructor.role,
          addedAt: courseInstructor.createdAt,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .from(courseInstructor)
        .innerJoin(user, eq(user.id, courseInstructor.userId))
        .where(eq(courseInstructor.courseId, courseId))
        .orderBy(asc(courseInstructor.role), asc(user.name)),
      database
        .select({ id: category.id, name: category.name, slug: category.slug })
        .from(courseCategory)
        .innerJoin(category, eq(category.id, courseCategory.categoryId))
        .where(eq(courseCategory.courseId, courseId))
        .orderBy(asc(category.name)),
      database
        .select({
          id: section.id,
          title: section.title,
          description: section.description,
          openAt: section.openAt,
          dueAt: section.dueAt,
          order: section.order,
        })
        .from(section)
        .where(eq(section.courseId, courseId))
        .orderBy(asc(section.order), asc(section.createdAt)),
      database
        .select({
          id: lesson.id,
          sectionId: lesson.sectionId,
          title: lesson.title,
          type: lesson.type,
          order: lesson.order,
          content: lesson.content,
        })
        .from(lesson)
        .innerJoin(section, eq(lesson.sectionId, section.id))
        .where(eq(section.courseId, courseId))
        .orderBy(
          asc(section.order),
          asc(section.createdAt),
          asc(lesson.order),
          asc(lesson.createdAt),
        ),
      database
        .select({
          id: enrollment.id,
          status: enrollment.status,
        })
        .from(enrollment)
        .where(and(eq(enrollment.courseId, courseId), eq(enrollment.userId, userId)))
        .limit(1),
    ]);

  const seenInstructorIds = new Set<string>();
  const instructorRows: Array<CourseInstructorPreview & { addedAt: Date }> = [];
  for (const row of [...creatorRows, ...coInstructorRows]) {
    if (seenInstructorIds.has(row.userId)) continue;
    seenInstructorIds.add(row.userId);
    instructorRows.push(row);
  }

  const lessonsBySection = new Map<string, CatalogLessonRow[]>();
  for (const lr of lessonRows) {
    const list = lessonsBySection.get(lr.sectionId) ?? [];
    list.push({
      id: lr.id,
      sectionId: lr.sectionId,
      title: lr.title,
      type: lr.type,
      order: lr.order,
      content: lr.content,
    });
    lessonsBySection.set(lr.sectionId, list);
  }

  const sections: CatalogSectionWithLessons[] = sectionRows.map((s) => ({
    ...s,
    lessons: lessonsBySection.get(s.id) ?? [],
  }));

  const enr = enrollmentRow[0];
  let certificateId: string | null = null;
  if (enr) {
    const [cert] = await database
      .select({ id: certificate.id })
      .from(certificate)
      .where(eq(certificate.enrollmentId, enr.id))
      .limit(1);
    certificateId = cert?.id ?? null;
  }

  return {
    ...courseRow,
    instructors: instructorRows,
    categories: categoryRows,
    sections,
    enrollmentId: enr?.id ?? null,
    enrollmentStatus: enr?.status ?? null,
    certificateId,
  };
}

export async function listLessonRowsForCourseEstimation(
  database: Database,
  courseIds: string[],
): Promise<Array<{ courseId: string; type: LessonType; content: unknown }>> {
  if (courseIds.length === 0) return [];

  return database
    .select({
      courseId: section.courseId,
      type: lesson.type,
      content: lesson.content,
    })
    .from(lesson)
    .innerJoin(section, eq(lesson.sectionId, section.id))
    .where(inArray(section.courseId, courseIds));
}
