import {
  createEnrollment,
  getCourseById,
  getCourseEnrollmentDetail,
  getEnrollmentProgressSummary,
  getLessonWithCourseId,
  listCourseEnrollments,
  markLessonCompleted,
  markLessonStarted,
  removeEnrollment,
  submitLessonAttempt,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  assertCanReadCatalogCourse,
  assertCanReadPublicCourse,
  assertCanUpdatePublicCourse,
} from "../lib/public-course-access";
import {
  enrollInCourseInputSchema,
  getCourseEnrollmentDetailSchema,
  getMyCourseProgressInputSchema,
  listCourseEnrollmentsSchema,
  markLessonCompletedInputSchema,
  markLessonStartedInputSchema,
  removeCourseEnrollmentSchema,
  submitLessonAttemptInputSchema,
} from "../schemas";
import { platformPermissionMiddleware } from "../middleware/permissions";

function assertLearnerCanReadCourseOrThrow(
  detail: Awaited<ReturnType<typeof getCourseById>> | null | undefined,
  session: Parameters<typeof assertCanReadCatalogCourse>[0],
): asserts detail is NonNullable<typeof detail> {
  if (!detail || detail.status !== "published") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  assertCanReadCatalogCourse(session, {
    organizationId: detail.organizationId,
    createdBy: detail.createdBy,
    instructors: detail.instructors,
  });
}

/** Legacy enrollment endpoint: platform-published courses only (catalog org enroll uses `catalog.enroll`). */
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
  listByCourse: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(listCourseEnrollmentsSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }
      assertCanUpdatePublicCourse(ctx.session, detail);

      return await listCourseEnrollments(ctx.db, input);
    }),

  getEnrollmentDetail: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(getCourseEnrollmentDetailSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }
      assertCanUpdatePublicCourse(ctx.session, detail);

      const row = await getCourseEnrollmentDetail(ctx.db, input);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      return row;
    }),

  removeEnrollment: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(removeCourseEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }
      assertCanUpdatePublicCourse(ctx.session, detail);

      const deleted = await removeEnrollment(ctx.db, { enrollmentId: input.enrollmentId });
      if (!deleted || deleted.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      return { success: true };
    }),

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
      assertLearnerCanReadCourseOrThrow(detail, ctx.session);

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
      assertLearnerCanReadCourseOrThrow(detail, ctx.session);

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
      assertLearnerCanReadCourseOrThrow(detail, ctx.session);

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
      assertLearnerCanReadCourseOrThrow(detail, ctx.session);

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
