import { asc, eq } from "drizzle-orm";

import type { Database } from "..";
import { lesson, section } from "../schema/course";

export type LessonRow = typeof lesson.$inferSelect;

export type LessonWithCourseId = LessonRow & { courseId: string };

export type LessonListItem = {
  id: string;
  sectionId: string;
  title: string;
  order: number;
  type: string;
};

/** Join lesson → section to verify course ownership (platform courses). */
export async function getLessonWithCourseId(
  database: Database,
  lessonId: string,
): Promise<LessonWithCourseId | null> {
  const rows = await database
    .select({
      lesson,
      courseId: section.courseId,
    })
    .from(lesson)
    .innerJoin(section, eq(lesson.sectionId, section.id))
    .where(eq(lesson.id, lessonId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { ...row.lesson, courseId: row.courseId };
}

export async function listLessonsForCourse(
  database: Database,
  courseId: string,
): Promise<LessonListItem[]> {
  return database
    .select({
      id: lesson.id,
      sectionId: lesson.sectionId,
      title: lesson.title,
      order: lesson.order,
      type: lesson.type,
    })
    .from(lesson)
    .innerJoin(section, eq(lesson.sectionId, section.id))
    .where(eq(section.courseId, courseId))
    .orderBy(asc(section.order), asc(section.createdAt), asc(lesson.order), asc(lesson.createdAt));
}

type JsonDoc = Record<string, unknown> | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Remove answer key metadata for non-author lesson views. */
export function stripQuestionAnswersFromContent(doc: unknown): unknown {
  if (doc == null) return doc;
  if (Array.isArray(doc)) {
    return doc.map(stripQuestionAnswersFromContent);
  }
  if (!isRecord(doc)) return doc;

  const node = doc as Record<string, unknown>;
  const type = node.type;
  const next: Record<string, unknown> = { ...node };

  if (type === "question" && isRecord(node.attrs)) {
    const attrs = { ...node.attrs } as Record<string, unknown>;
    const options = attrs.options;
    if (Array.isArray(options)) {
      attrs.options = options.map((option) => {
        if (!isRecord(option)) return option;
        const opt = { ...option };
        delete opt.isCorrect;
        return opt;
      });
    }
    delete attrs.explanation;
    next.attrs = attrs;
  }

  if (Array.isArray(node.content)) {
    next.content = node.content.map(stripQuestionAnswersFromContent);
  }

  return next;
}

function findQuestionAttrs(doc: unknown, questionId: string): Record<string, unknown> | null {
  if (doc == null) return null;
  if (Array.isArray(doc)) {
    for (const part of doc) {
      const found = findQuestionAttrs(part, questionId);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(doc)) return null;

  const node = doc as Record<string, unknown>;
  if (node.type === "question" && isRecord(node.attrs)) {
    const attrs = node.attrs as Record<string, unknown>;
    if (attrs.questionId === questionId) {
      return attrs;
    }
  }
  if (Array.isArray(node.content)) {
    for (const part of node.content) {
      const found = findQuestionAttrs(part, questionId);
      if (found) return found;
    }
  }
  return null;
}

type QuestionOption = { id?: string; isCorrect?: boolean };

export async function checkLessonAnswer(
  database: Database,
  input: { lessonId: string; questionId: string; selected: string[] },
): Promise<{ isCorrect: boolean }> {
  const rows = await database.select().from(lesson).where(eq(lesson.id, input.lessonId)).limit(1);
  const row = rows[0];

  if (!row?.content) {
    return { isCorrect: false };
  }

  const attrs = findQuestionAttrs(row.content as JsonDoc, input.questionId);
  if (!attrs) {
    return { isCorrect: false };
  }

  const type = attrs.type === "multi" ? "multi" : "single";
  const rawOptions = attrs.options;
  if (!Array.isArray(rawOptions)) {
    return { isCorrect: false };
  }

  const options = rawOptions as QuestionOption[];
  const correctIds = options
    .filter((o) => o.isCorrect === true && typeof o.id === "string")
    .map((o) => o.id as string)
    .sort();

  const givenIds = [...input.selected].sort();

  if (type === "single") {
    return {
      isCorrect: correctIds.length === 1 && givenIds.length === 1 && correctIds[0] === givenIds[0],
    };
  }

  return {
    isCorrect:
      correctIds.length === givenIds.length && correctIds.every((id, i) => id === givenIds[i]),
  };
}

export async function updateLessonContent(
  database: Database,
  input: { lessonId: string; content: unknown },
): Promise<LessonRow | null> {
  const [updated] = await database
    .update(lesson)
    .set({
      content: input.content,
      updatedAt: new Date(),
    })
    .where(eq(lesson.id, input.lessonId))
    .returning();

  return updated ?? null;
}

export async function updateLessonPatch(
  database: Database,
  input: { lessonId: string; title?: string; content?: unknown },
): Promise<LessonRow | null> {
  const patch: Partial<typeof lesson.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;

  const [updated] = await database
    .update(lesson)
    .set(patch)
    .where(eq(lesson.id, input.lessonId))
    .returning();

  return updated ?? null;
}
