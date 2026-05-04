import { getStudentDashboardOverview } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  studentDashboardOverviewInputSchema,
  studentDashboardOverviewOutputSchema,
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
});
