import { and, asc, eq, max } from "drizzle-orm";

import type { Database } from "..";
import { LESSON_TYPES, lesson, section } from "../schema/course";

export type CurriculumLesson = {
  id: string;
  sectionId: string;
  title: string;
  type: (typeof LESSON_TYPES)[number];
  order: number;
  content: unknown;
  updatedAt: Date;
};

export type CurriculumSection = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  openAt: Date | null;
  dueAt: Date | null;
  order: number;
  lessons: CurriculumLesson[];
};

export async function getCourseCurriculum(
  database: Database,
  input: { courseId: string },
): Promise<CurriculumSection[]> {
  const [sectionRows, lessonRows] = await Promise.all([
    database
      .select({
        id: section.id,
        courseId: section.courseId,
        title: section.title,
        description: section.description,
        openAt: section.openAt,
        dueAt: section.dueAt,
        order: section.order,
      })
      .from(section)
      .where(eq(section.courseId, input.courseId))
      .orderBy(asc(section.order), asc(section.createdAt)),
    database
      .select({
        id: lesson.id,
        sectionId: lesson.sectionId,
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        content: lesson.content,
        updatedAt: lesson.updatedAt,
      })
      .from(lesson)
      .innerJoin(section, eq(lesson.sectionId, section.id))
      .where(eq(section.courseId, input.courseId))
      .orderBy(
        asc(section.order),
        asc(section.createdAt),
        asc(lesson.order),
        asc(lesson.createdAt),
      ),
  ]);

  const lessonsBySection = new Map<string, CurriculumLesson[]>();
  for (const lessonRow of lessonRows) {
    const rows = lessonsBySection.get(lessonRow.sectionId) ?? [];
    rows.push(lessonRow);
    lessonsBySection.set(lessonRow.sectionId, rows);
  }

  return sectionRows.map((sectionRow) => ({
    ...sectionRow,
    lessons: lessonsBySection.get(sectionRow.id) ?? [],
  }));
}

export async function createSection(
  database: Database,
  input: {
    courseId: string;
    title: string;
    description?: string | null;
    openAt?: Date | null;
    dueAt?: Date | null;
  },
): Promise<CurriculumSection> {
  const [orderRow] = await database
    .select({ value: max(section.order) })
    .from(section)
    .where(eq(section.courseId, input.courseId));

  const [created] = await database
    .insert(section)
    .values({
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      openAt: input.openAt ?? null,
      dueAt: input.dueAt ?? null,
      order: (orderRow?.value ?? -1) + 1,
    })
    .returning({
      id: section.id,
      courseId: section.courseId,
      title: section.title,
      description: section.description,
      openAt: section.openAt,
      dueAt: section.dueAt,
      order: section.order,
    });

  if (!created) {
    throw new Error("Failed to create section");
  }

  return {
    ...created,
    lessons: [],
  };
}

export async function createLesson(
  database: Database,
  input: {
    courseId: string;
    sectionId: string;
    title: string;
    type?: (typeof LESSON_TYPES)[number];
  },
): Promise<CurriculumLesson | null> {
  const [matchingSection] = await database
    .select({ id: section.id })
    .from(section)
    .where(and(eq(section.id, input.sectionId), eq(section.courseId, input.courseId)))
    .limit(1);

  if (!matchingSection) {
    return null;
  }

  const [orderRow] = await database
    .select({ value: max(lesson.order) })
    .from(lesson)
    .where(eq(lesson.sectionId, input.sectionId));

  const [created] = await database
    .insert(lesson)
    .values({
      sectionId: input.sectionId,
      title: input.title,
      type: input.type ?? "article",
      order: (orderRow?.value ?? -1) + 1,
      content: null,
    })
    .returning({
      id: lesson.id,
      sectionId: lesson.sectionId,
      title: lesson.title,
      type: lesson.type,
      order: lesson.order,
      content: lesson.content,
      updatedAt: lesson.updatedAt,
    });

  return created ?? null;
}
