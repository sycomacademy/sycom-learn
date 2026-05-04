import {
  checkLessonAnswer,
  createLesson,
  deleteLessonById,
  getCourseById,
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
import {
  assertCanReadPublicCourse,
  assertCanUpdatePublicCourse,
  canUpdatePublicCourse,
} from "../lib/public-course-access";
import { assertValidLessonConfiguration } from "../lib/lesson-validation";
import { protectedProcedure, router } from "../init";
import { platformPermissionMiddleware } from "../middleware/permissions";

function assertReadablePublicCourseOrThrow(
  detail: Awaited<ReturnType<typeof getCourseById>> | null | undefined,
  session: Parameters<typeof assertCanReadPublicCourse>[0],
): asserts detail is NonNullable<typeof detail> {
  if (!detail || detail.organizationId !== null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  assertCanReadPublicCourse(session, detail);
}

function assertUpdatablePublicCourseOrThrow(
  detail: Awaited<ReturnType<typeof getCourseById>> | null | undefined,
  session: Parameters<typeof assertCanUpdatePublicCourse>[0],
): asserts detail is NonNullable<typeof detail> {
  if (!detail || detail.organizationId !== null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  assertCanUpdatePublicCourse(session, detail);
}

export const lessonRouter = router({
  listByCourse: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(listLessonsByCourseInputSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadablePublicCourseOrThrow(detail, ctx.session);
      return await listLessonsForCourse(ctx.db, input.courseId);
    }),

  create: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(createLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertUpdatablePublicCourseOrThrow(detail, ctx.session);

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

  get: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getLessonInputSchema)
    .query(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      const detail = await getCourseById(ctx.db, { courseId: row.courseId });
      assertReadablePublicCourseOrThrow(detail, ctx.session);

      const fullContent = row.content;
      const canAuthor = detail
        ? hasPlatformPermission(ctx.session, { course: ["update"] }) &&
          canUpdatePublicCourse(ctx.session, detail)
        : false;
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

  update: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(updateLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      const detail = await getCourseById(ctx.db, { courseId: row.courseId });
      assertUpdatablePublicCourseOrThrow(detail, ctx.session);

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

  delete: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(deleteLessonInputSchema)
    .mutation(async ({ ctx, input }) => {
      const lessonContext = await getLessonCourseContext(ctx.db, input);
      if (!lessonContext) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: lessonContext.courseId });
      assertUpdatablePublicCourseOrThrow(detail, ctx.session);

      const deleted = await deleteLessonById(ctx.db, input);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      return { success: true };
    }),

  checkAnswer: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(checkLessonAnswerInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      const detail = await getCourseById(ctx.db, { courseId: row.courseId });
      assertReadablePublicCourseOrThrow(detail, ctx.session);

      return checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
    }),
});
