import {
  checkLessonAnswer,
  getCourseById,
  getLessonWithCourseId,
  listLessonsForCourse,
  stripQuestionAnswersFromContent,
  updateLessonPatch,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import {
  checkLessonAnswerInputSchema,
  getLessonInputSchema,
  listLessonsByCourseInputSchema,
  updateLessonInputSchema,
} from "../schemas";
import { hasPlatformPermission } from "../middleware/permissions";
import { protectedProcedure, router } from "../init";
import { platformPermissionMiddleware } from "../middleware/permissions";

function assertPlatformCourseOrThrow(
  detail: Awaited<ReturnType<typeof getCourseById>> | null | undefined,
): asserts detail is NonNullable<typeof detail> {
  if (!detail || detail.organizationId !== null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
}

export const lessonRouter = router({
  listByCourse: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(listLessonsByCourseInputSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertPlatformCourseOrThrow(detail);
      return await listLessonsForCourse(ctx.db, input.courseId);
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
      assertPlatformCourseOrThrow(detail);

      const fullContent = row.content;
      const canAuthor = hasPlatformPermission(ctx.session, { course: ["update"] });
      const content = canAuthor ? fullContent : stripQuestionAnswersFromContent(fullContent);

      return {
        id: row.id,
        sectionId: row.sectionId,
        courseId: row.courseId,
        title: row.title,
        type: row.type,
        order: row.order,
        estimatedDuration: row.estimatedDuration,
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
      assertPlatformCourseOrThrow(detail);

      const updated = await updateLessonPatch(ctx.db, {
        lessonId: input.lessonId,
        title: input.patch.title,
        content: input.patch.content,
      });

      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lesson" });
      }

      return updated;
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
      assertPlatformCourseOrThrow(detail);

      return checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
    }),
});
