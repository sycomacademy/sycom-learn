import {
  getCourseAnalyticsStudentDetail,
  getEnrollmentForUserCourse,
  getStudentDashboardOverview,
  getStudentLibrary,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  studentCourseScoresInputSchema,
  studentDashboardOverviewInputSchema,
  studentDashboardOverviewOutputSchema,
  studentLibraryInputSchema,
  studentLibraryOutputSchema,
} from "../schemas";

export const studentRouter = router({
  getDashboardOverview: protectedProcedure
    .input(studentDashboardOverviewInputSchema)
    .output(studentDashboardOverviewOutputSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "public_student") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const orgId = ctx.session.session.activeOrganizationId ?? null;

      return await getStudentDashboardOverview(ctx.db, {
        userId: ctx.session.user.id,
        scope: orgId ? "organization" : "platform",
        organizationId: orgId ?? undefined,
        enrollmentDays: input.enrollmentDays,
        continueLearningLimit: input.continueLearningLimit,
      });
    }),
  getLibrary: protectedProcedure
    .input(studentLibraryInputSchema)
    .output(studentLibraryOutputSchema)
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== "public_student") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const orgId = ctx.session.session.activeOrganizationId ?? null;

      return await getStudentLibrary(ctx.db, {
        userId: ctx.session.user.id,
        scope: orgId ? "organization" : "platform",
        organizationId: orgId ?? undefined,
      });
    }),
  getCourseScores: protectedProcedure
    .input(studentCourseScoresInputSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "public_student") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const userEnrollment = await getEnrollmentForUserCourse(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!userEnrollment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      }

      const detail = await getCourseAnalyticsStudentDetail(ctx.db, {
        courseId: input.courseId,
        enrollmentId: userEnrollment.id,
      });
      if (!detail) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment detail not found" });
      }

      return detail;
    }),
});
