import {
  createEnrollment,
  getCourseById,
  getEnrollmentProgressSummary,
  getLessonWithCourseId,
  markLessonCompleted,
  markLessonStarted,
  submitLessonAttempt,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import { assertCanReadPublicCourse } from "../lib/public-course-access";
import {
  enrollInCourseInputSchema,
  getMyCourseProgressInputSchema,
  markLessonCompletedInputSchema,
  markLessonStartedInputSchema,
  submitLessonAttemptInputSchema,
} from "../schemas";
import { platformPermissionMiddleware } from "../middleware/permissions";

function assertReadableCourseOrThrow(
  detail: Awaited<ReturnType<typeof getCourseById>> | null | undefined,
  session: Parameters<typeof assertCanReadPublicCourse>[0],
): asserts detail is NonNullable<typeof detail> {
  if (!detail || detail.organizationId !== null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  assertCanReadPublicCourse(session, detail);
}

export const enrollmentRouter = router({
  enroll: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(enrollInCourseInputSchema)
    .mutation(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadableCourseOrThrow(detail, ctx.session);

      return await createEnrollment(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
    }),

  getMyCourseProgress: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getMyCourseProgressInputSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadableCourseOrThrow(detail, ctx.session);

      return await getEnrollmentProgressSummary(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
    }),

  markLessonStarted: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(markLessonStartedInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadableCourseOrThrow(detail, ctx.session);

      await markLessonStarted(ctx.db, { ...input, userId: ctx.session.user.id });
      return { success: true };
    }),

  markLessonCompleted: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(markLessonCompletedInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadableCourseOrThrow(detail, ctx.session);

      if (row.type !== "article") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only article lessons can be marked complete directly",
        });
      }

      await markLessonCompleted(ctx.db, { ...input, userId: ctx.session.user.id });
      return { success: true };
    }),

  submitAttempt: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(submitLessonAttemptInputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      assertReadableCourseOrThrow(detail, ctx.session);

      if (row.type !== "quiz" && row.type !== "exam") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only quiz and exam lessons accept scored attempts",
        });
      }

      const now = new Date();
      if (row.openAt && now < row.openAt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This assessment is not open yet" });
      }
      if (row.dueAt && now > row.dueAt) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This assessment is closed" });
      }

      return await submitLessonAttempt(ctx.db, { ...input, userId: ctx.session.user.id });
    }),
});
