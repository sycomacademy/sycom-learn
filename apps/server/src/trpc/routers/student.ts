import type { Database } from "@sycom/db";
import {
  getCourseAnalyticsStudentDetail,
  getEnrollmentForUserCourse,
  getMemberRole,
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

async function assertPublicStudentOrActiveOrgMember(ctx: {
  db: Database;
  session: {
    user: { id: string; role?: string | null };
    session: { activeOrganizationId?: string | null };
  };
}): Promise<void> {
  if (ctx.session.user.role === "public_student") {
    return;
  }

  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  const memberRole = await getMemberRole(ctx.db, {
    organizationId,
    userId: ctx.session.user.id,
  });
  if (!memberRole) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const studentRouter = router({
  getDashboardOverview: protectedProcedure
    .input(studentDashboardOverviewInputSchema)
    .output(studentDashboardOverviewOutputSchema)
    .query(async ({ ctx, input }) => {
      await assertPublicStudentOrActiveOrgMember(ctx);

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
      await assertPublicStudentOrActiveOrgMember(ctx);

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
      await assertPublicStudentOrActiveOrgMember(ctx);

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
