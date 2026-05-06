import {
  checkLessonAnswer,
  createLesson,
  deleteLessonById,
  getLessonCourseContext,
  getLessonWithCourseId,
  listLessonsForCourse,
  stripQuestionAnswersFromContent,
  updateLessonPatch,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import {
  checkLessonAnswerInputSchema,
  createLessonInputSchema,
  deleteLessonInputSchema,
  getLessonInputSchema,
  listLessonsByCourseInputSchema,
  updateLessonInputSchema,
} from "../schemas";
import { hasPlatformPermission } from "../middleware/permissions";
import { canUpdatePublicCourse } from "../lib/public-course-access";
import {
  assertPlatformOrOrgCourseRead,
  assertPlatformOrOrgCourseWrite,
} from "../lib/org-course-access";
import { assertValidLessonConfiguration } from "../lib/lesson-validation";
import { protectedProcedure, router } from "../init";

export const lessonRouter = router({
  listByCourse: protectedProcedure
    .input(listLessonsByCourseInputSchema)
    .query(async ({ ctx, input }) => {
      await assertPlatformOrOrgCourseRead(ctx, input.courseId);
      return await listLessonsForCourse(ctx.db, input.courseId);
    }),

  create: protectedProcedure.input(createLessonInputSchema).mutation(async ({ ctx, input }) => {
    await assertPlatformOrOrgCourseWrite(ctx, input.courseId);

    assertValidLessonConfiguration({
      type: input.type,
      content: null,
      openAt: input.openAt ?? null,
      dueAt: input.dueAt ?? null,
    });

    const created = await createLesson(ctx.db, input);
    if (!created) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
    }

    return created;
  }),

  get: protectedProcedure.input(getLessonInputSchema).query(async ({ ctx, input }) => {
    const row = await getLessonWithCourseId(ctx.db, input.lessonId);
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }

    const detail = await assertPlatformOrOrgCourseRead(ctx, row.courseId);

    const fullContent = row.content;
    const canAuthor =
      detail.organizationId === null
        ? hasPlatformPermission(ctx.session, { course: ["update"] }) &&
          canUpdatePublicCourse(ctx.session, detail)
        : true;
    const content = canAuthor ? fullContent : stripQuestionAnswersFromContent(fullContent);

    return {
      id: row.id,
      sectionId: row.sectionId,
      courseId: row.courseId,
      title: row.title,
      type: row.type,
      openAt: row.openAt,
      dueAt: row.dueAt,
      order: row.order,
      content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }),

  update: protectedProcedure.input(updateLessonInputSchema).mutation(async ({ ctx, input }) => {
    const row = await getLessonWithCourseId(ctx.db, input.lessonId);
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }

    await assertPlatformOrOrgCourseWrite(ctx, row.courseId);

    const nextType = input.patch.type ?? row.type;
    const nextContent = input.patch.content ?? row.content;
    const nextOpenAt = input.patch.openAt !== undefined ? input.patch.openAt : row.openAt;
    const nextDueAt = input.patch.dueAt !== undefined ? input.patch.dueAt : row.dueAt;

    assertValidLessonConfiguration({
      type: nextType,
      content: nextContent,
      openAt: nextOpenAt,
      dueAt: nextDueAt,
    });

    const updated = await updateLessonPatch(ctx.db, {
      lessonId: input.lessonId,
      title: input.patch.title,
      content: input.patch.content,
      type: input.patch.type,
      openAt: input.patch.openAt,
      dueAt: input.patch.dueAt,
    });

    if (!updated) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lesson" });
    }

    return updated;
  }),

  delete: protectedProcedure.input(deleteLessonInputSchema).mutation(async ({ ctx, input }) => {
    const lessonContext = await getLessonCourseContext(ctx.db, input);
    if (!lessonContext) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }

    await assertPlatformOrOrgCourseWrite(ctx, lessonContext.courseId);

    const deleted = await deleteLessonById(ctx.db, input);
    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }

    return { success: true };
  }),

  checkAnswer: protectedProcedure
    .input(checkLessonAnswerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      await assertPlatformOrOrgCourseRead(ctx, row.courseId);

      return checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
    }),
});
