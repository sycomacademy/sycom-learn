import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { organization, user, type UserRole } from "../schema/auth";
import {
  category,
  course,
  courseCategory,
  courseInstructor,
  lesson,
  section,
  type CourseStatus,
  type DifficultyLevel,
  type InstructorRole,
} from "../schema/course";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CourseScope = "platform" | "organization";

export type CourseInstructorPreview = {
  userId: string;
  name: string;
  image: string | null;
  role: InstructorRole;
};

export type CourseRow = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  status: CourseStatus;
  difficulty: DifficultyLevel;
  estimatedDuration: number | null;
  organizationId: string | null;
  organizationName: string | null;
  createdAt: Date;
  updatedAt: Date;
  instructors: CourseInstructorPreview[];
  categories: Array<{ id: string; name: string }>;
};

export type ListCoursesFilter = {
  scope: CourseScope;
  organizationId?: string;
  actor?: { userId: string; role: UserRole | null | undefined };
  search?: string;
  statuses?: CourseStatus[];
  difficulties?: DifficultyLevel[];
  categoryIds?: string[];
  instructorId?: string;
  limit: number;
  offset: number;
  sortBy: "title" | "createdAt" | "updatedAt" | "status" | "difficulty";
  sortDirection: "asc" | "desc";
};

export type ListCoursesResult = {
  rows: CourseRow[];
  totalCount: number;
};

export type CourseSectionPreview = {
  id: string;
  title: string;
  description: string | null;
  openAt: Date | null;
  dueAt: Date | null;
  order: number;
  lessonCount: number;
};

export type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: unknown;
  imageUrl: string | null;
  difficulty: DifficultyLevel;
  estimatedDuration: number | null;
  status: CourseStatus;
  organizationId: string | null;
  organizationName: string | null;
  sourceCourseId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  instructors: Array<CourseInstructorPreview & { addedAt: Date }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  sections: CourseSectionPreview[];
};

export type CreateCourseInput = {
  scope: CourseScope;
  organizationId?: string;
  title: string;
  slug: string;
  description?: string;
  summary?: unknown;
  imageUrl?: string;
  difficulty: DifficultyLevel;
  estimatedDuration?: number;
  status: CourseStatus;
  createdBy: string;
};

export type UpdateCoursePatch = {
  title?: string;
  slug?: string;
  description?: string | null;
  summary?: unknown;
  imageUrl?: string | null;
  difficulty?: DifficultyLevel;
  estimatedDuration?: number | null;
  status?: CourseStatus;
};

// ---------------------------------------------------------------------------
// Sort columns
// ---------------------------------------------------------------------------

const COURSE_SORT_COLUMNS = {
  title: course.title,
  createdAt: course.createdAt,
  updatedAt: course.updatedAt,
  status: course.status,
  difficulty: course.difficulty,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildScopeCondition(scope: CourseScope, organizationId?: string): SQL {
  if (scope === "platform") {
    return isNull(course.organizationId);
  }
  if (!organizationId) {
    throw new Error("organizationId is required when scope is 'organization'");
  }
  return eq(course.organizationId, organizationId);
}

function buildPlatformCourseVisibilityCondition(actor?: {
  userId: string;
  role: UserRole | null | undefined;
}): SQL | undefined {
  if (!actor?.role) {
    return sql`false`;
  }

  if (actor.role === "platform_admin" || actor.role === "public_student") {
    return undefined;
  }

  if (actor.role === "content_creator") {
    return (
      or(
        eq(course.createdBy, actor.userId),
        sql`${course.id} in (select ${courseInstructor.courseId} from ${courseInstructor} where ${eq(courseInstructor.userId, actor.userId)})`,
      ) ?? undefined
    );
  }

  return sql`false`;
}

async function loadInstructorsForCourses(
  database: Database,
  courseIds: string[],
): Promise<Map<string, CourseInstructorPreview[]>> {
  if (courseIds.length === 0) return new Map();

  const rows = await database
    .select({
      courseId: courseInstructor.courseId,
      userId: courseInstructor.userId,
      role: courseInstructor.role,
      name: user.name,
      image: user.image,
    })
    .from(courseInstructor)
    .innerJoin(user, eq(user.id, courseInstructor.userId))
    .where(inArray(courseInstructor.courseId, courseIds))
    .orderBy(asc(courseInstructor.role), asc(user.name));

  const byCourse = new Map<string, CourseInstructorPreview[]>();
  for (const row of rows) {
    const list = byCourse.get(row.courseId) ?? [];
    list.push({ userId: row.userId, name: row.name, image: row.image, role: row.role });
    byCourse.set(row.courseId, list);
  }
  return byCourse;
}

async function loadCategoriesForCourses(
  database: Database,
  courseIds: string[],
): Promise<Map<string, Array<{ id: string; name: string }>>> {
  if (courseIds.length === 0) return new Map();

  const rows = await database
    .select({
      courseId: courseCategory.courseId,
      id: category.id,
      name: category.name,
    })
    .from(courseCategory)
    .innerJoin(category, eq(category.id, courseCategory.categoryId))
    .where(inArray(courseCategory.courseId, courseIds))
    .orderBy(asc(category.name));

  const byCourse = new Map<string, Array<{ id: string; name: string }>>();
  for (const row of rows) {
    const list = byCourse.get(row.courseId) ?? [];
    list.push({ id: row.id, name: row.name });
    byCourse.set(row.courseId, list);
  }
  return byCourse;
}

// ---------------------------------------------------------------------------
// Courses — list / get
// ---------------------------------------------------------------------------

export async function listCourses(
  database: Database,
  input: ListCoursesFilter,
): Promise<ListCoursesResult> {
  const {
    scope,
    organizationId,
    actor,
    search,
    statuses,
    difficulties,
    categoryIds,
    instructorId,
    limit,
    offset,
    sortBy,
    sortDirection,
  } = input;

  const filters: SQL[] = [buildScopeCondition(scope, organizationId)];

  if (scope === "platform") {
    const actorVisibility = buildPlatformCourseVisibilityCondition(actor);
    if (actorVisibility) {
      filters.push(actorVisibility);
    }
  }

  if (search) {
    const pattern = `%${search}%`;
    const expr = or(ilike(course.title, pattern), ilike(course.slug, pattern));
    if (expr) filters.push(expr);
  }
  if (statuses && statuses.length > 0) {
    filters.push(inArray(course.status, statuses));
  }
  if (difficulties && difficulties.length > 0) {
    filters.push(inArray(course.difficulty, difficulties));
  }
  if (categoryIds && categoryIds.length > 0) {
    filters.push(
      sql`${course.id} in (select ${courseCategory.courseId} from ${courseCategory} where ${inArray(courseCategory.categoryId, categoryIds)})`,
    );
  }
  if (instructorId) {
    filters.push(
      sql`${course.id} in (select ${courseInstructor.courseId} from ${courseInstructor} where ${eq(courseInstructor.userId, instructorId)})`,
    );
  }

  const where = and(...filters);
  const orderColumn = COURSE_SORT_COLUMNS[sortBy];
  const orderBy = sortDirection === "desc" ? desc(orderColumn) : asc(orderColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: course.id,
        title: course.title,
        slug: course.slug,
        imageUrl: course.imageUrl,
        status: course.status,
        difficulty: course.difficulty,
        estimatedDuration: course.estimatedDuration,
        organizationId: course.organizationId,
        organizationName: organization.name,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })
      .from(course)
      .leftJoin(organization, eq(organization.id, course.organizationId))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(course).where(where),
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

export async function getCourseById(
  database: Database,
  input: { courseId: string },
): Promise<CourseDetail | null> {
  const { courseId } = input;

  const [courseRow] = await database
    .select({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      summary: course.summary,
      imageUrl: course.imageUrl,
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      status: course.status,
      organizationId: course.organizationId,
      organizationName: organization.name,
      sourceCourseId: course.sourceCourseId,
      createdBy: course.createdBy,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    })
    .from(course)
    .leftJoin(organization, eq(organization.id, course.organizationId))
    .where(eq(course.id, courseId))
    .limit(1);

  if (!courseRow) return null;

  const [instructorRows, categoryRows, sectionRows] = await Promise.all([
    database
      .select({
        userId: courseInstructor.userId,
        role: courseInstructor.role,
        addedAt: courseInstructor.createdAt,
        name: user.name,
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
        lessonCount: sql<number>`(select count(*)::int from ${lesson} where ${lesson.sectionId} = ${section.id})`,
      })
      .from(section)
      .where(eq(section.courseId, courseId))
      .orderBy(asc(section.order), asc(section.createdAt)),
  ]);

  return {
    ...courseRow,
    instructors: instructorRows,
    categories: categoryRows,
    sections: sectionRows,
  };
}

// ---------------------------------------------------------------------------
// Courses — create / update / delete
// ---------------------------------------------------------------------------

export async function createCourse(
  database: Database,
  input: CreateCourseInput,
): Promise<{ id: string }> {
  const [row] = await database
    .insert(course)
    .values({
      organizationId: input.scope === "organization" ? (input.organizationId ?? null) : null,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      summary: input.summary ?? null,
      imageUrl: input.imageUrl ?? null,
      difficulty: input.difficulty,
      estimatedDuration: input.estimatedDuration ?? null,
      status: input.status,
      createdBy: input.createdBy,
    })
    .returning({ id: course.id });

  if (!row) throw new Error("Failed to create course");
  return { id: row.id };
}

export async function updateCourse(
  database: Database,
  input: { courseId: string; patch: UpdateCoursePatch },
): Promise<void> {
  const { courseId, patch } = input;
  if (Object.keys(patch).length === 0) return;
  await database.update(course).set(patch).where(eq(course.id, courseId));
}

export async function deleteCourse(database: Database, input: { courseId: string }): Promise<void> {
  await database.delete(course).where(eq(course.id, input.courseId));
}

// ---------------------------------------------------------------------------
// Seeding (platform → org fork)
// ---------------------------------------------------------------------------
// Note: neon-http driver does not support multi-statement transactions, so we
// sequence inserts and best-effort clean up the new course on failure
// (cascades drop child rows).

export type SeedCourseResult = { organizationId: string; newCourseId: string };

export async function seedCourseToOrganizations(
  database: Database,
  input: { sourceCourseId: string; organizationIds: string[]; seededByUserId: string },
): Promise<SeedCourseResult[]> {
  const { sourceCourseId, organizationIds, seededByUserId } = input;

  const [src] = await database
    .select({
      title: course.title,
      slug: course.slug,
      description: course.description,
      summary: course.summary,
      imageUrl: course.imageUrl,
      difficulty: course.difficulty,
      estimatedDuration: course.estimatedDuration,
      status: course.status,
      organizationId: course.organizationId,
    })
    .from(course)
    .where(eq(course.id, sourceCourseId))
    .limit(1);

  if (!src) throw new Error("Source course not found");
  if (src.organizationId !== null) {
    throw new Error("Only platform courses can be seeded into organizations");
  }

  const sectionRows = await database
    .select({
      id: section.id,
      title: section.title,
      description: section.description,
      openAt: section.openAt,
      dueAt: section.dueAt,
      order: section.order,
    })
    .from(section)
    .where(eq(section.courseId, sourceCourseId))
    .orderBy(asc(section.order));

  const lessonRows =
    sectionRows.length > 0
      ? await database
          .select({
            sectionId: lesson.sectionId,
            title: lesson.title,
            content: lesson.content,
            type: lesson.type,
            order: lesson.order,
            estimatedDuration: lesson.estimatedDuration,
          })
          .from(lesson)
          .where(
            inArray(
              lesson.sectionId,
              sectionRows.map((s) => s.id),
            ),
          )
      : [];

  const categoryLinks = await database
    .select({ categoryId: courseCategory.categoryId })
    .from(courseCategory)
    .where(eq(courseCategory.courseId, sourceCourseId));

  const results: SeedCourseResult[] = [];

  for (const orgId of organizationIds) {
    const [newCourse] = await database
      .insert(course)
      .values({
        organizationId: orgId,
        sourceCourseId,
        title: src.title,
        slug: src.slug,
        description: src.description,
        summary: src.summary,
        imageUrl: src.imageUrl,
        difficulty: src.difficulty,
        estimatedDuration: src.estimatedDuration,
        status: "draft",
        createdBy: seededByUserId,
      })
      .returning({ id: course.id });

    if (!newCourse) throw new Error(`Failed to seed course into org ${orgId}`);

    try {
      const sectionIdMap = new Map<string, string>();
      for (const sec of sectionRows) {
        const [newSection] = await database
          .insert(section)
          .values({
            courseId: newCourse.id,
            title: sec.title,
            description: sec.description,
            openAt: sec.openAt,
            dueAt: sec.dueAt,
            order: sec.order,
          })
          .returning({ id: section.id });
        if (!newSection) throw new Error("Failed to copy section");
        sectionIdMap.set(sec.id, newSection.id);
      }

      const newLessons = lessonRows
        .map((l) => {
          const newSectionId = sectionIdMap.get(l.sectionId);
          if (!newSectionId) return null;
          return {
            sectionId: newSectionId,
            title: l.title,
            content: l.content,
            type: l.type,
            order: l.order,
            estimatedDuration: l.estimatedDuration,
          };
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);

      if (newLessons.length > 0) {
        await database.insert(lesson).values(newLessons);
      }

      if (categoryLinks.length > 0) {
        await database
          .insert(courseCategory)
          .values(categoryLinks.map((c) => ({ courseId: newCourse.id, categoryId: c.categoryId })));
      }

      results.push({ organizationId: orgId, newCourseId: newCourse.id });
    } catch (err) {
      // Best-effort cleanup: cascades drop child rows.
      await database.delete(course).where(eq(course.id, newCourse.id));
      throw err;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Course instructors
// ---------------------------------------------------------------------------

export async function addCourseInstructor(
  database: Database,
  input: { courseId: string; userId: string; role: InstructorRole; addedBy: string },
): Promise<void> {
  await database
    .insert(courseInstructor)
    .values({
      courseId: input.courseId,
      userId: input.userId,
      role: input.role,
      addedBy: input.addedBy,
    })
    .onConflictDoUpdate({
      target: [courseInstructor.courseId, courseInstructor.userId],
      set: { role: input.role },
    });
}

export async function removeCourseInstructor(
  database: Database,
  input: { courseId: string; userId: string },
): Promise<void> {
  await database
    .delete(courseInstructor)
    .where(
      and(eq(courseInstructor.courseId, input.courseId), eq(courseInstructor.userId, input.userId)),
    );
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  order: number;
  courseCount: number;
};

export type ListCategoriesFilter = {
  search?: string;
  limit: number;
  offset: number;
  sortBy: "name" | "slug" | "order";
  sortDirection: "asc" | "desc";
};

export type ListCategoriesResult = {
  rows: CategoryRow[];
  totalCount: number;
};

const CATEGORY_SORT_COLUMNS = {
  name: category.name,
  slug: category.slug,
  order: category.order,
} as const;

export async function listCategories(
  database: Database,
  input: ListCategoriesFilter,
): Promise<ListCategoriesResult> {
  const { search, limit, offset, sortBy, sortDirection } = input;

  const filters: SQL[] = [];
  if (search) {
    const pattern = `%${search}%`;
    const expr = or(ilike(category.name, pattern), ilike(category.slug, pattern));
    if (expr) filters.push(expr);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderColumn = CATEGORY_SORT_COLUMNS[sortBy];
  const orderBy = sortDirection === "desc" ? desc(orderColumn) : asc(orderColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: category.id,
        name: category.name,
        slug: category.slug,
        order: category.order,
        courseCount: sql<number>`(select count(*)::int from ${courseCategory} where ${courseCategory.categoryId} = ${category.id})`,
      })
      .from(category)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(category).where(where),
  ]);

  return { rows, totalCount: totalRow[0]?.value ?? 0 };
}

export async function createCategory(
  database: Database,
  input: { name: string; slug: string; order?: number },
): Promise<{ id: string }> {
  const [row] = await database
    .insert(category)
    .values({ name: input.name, slug: input.slug, order: input.order ?? 0 })
    .returning({ id: category.id });
  if (!row) throw new Error("Failed to create category");
  return { id: row.id };
}

export async function updateCategory(
  database: Database,
  input: { categoryId: string; patch: { name?: string; slug?: string; order?: number } },
): Promise<void> {
  const { categoryId, patch } = input;
  if (Object.keys(patch).length === 0) return;
  await database.update(category).set(patch).where(eq(category.id, categoryId));
}

export async function deleteCategory(
  database: Database,
  input: { categoryId: string },
): Promise<void> {
  await database.delete(category).where(eq(category.id, input.categoryId));
}

export async function setCourseCategories(
  database: Database,
  input: { courseId: string; categoryIds: string[] },
): Promise<void> {
  const { courseId, categoryIds } = input;

  await database.delete(courseCategory).where(eq(courseCategory.courseId, courseId));

  if (categoryIds.length > 0) {
    await database
      .insert(courseCategory)
      .values(categoryIds.map((categoryId) => ({ courseId, categoryId })));
  }
}
