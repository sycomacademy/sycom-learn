import { getContentCreatorDashboardOverview } from "@sycom/db/queries/content-creator-overview";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  creatorDashboardOverviewInputSchema,
  creatorDashboardOverviewOutputSchema,
} from "../schemas";

export const creatorRouter = router({
  getDashboardOverview: protectedProcedure
    .input(creatorDashboardOverviewInputSchema)
    .output(creatorDashboardOverviewOutputSchema)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "content_creator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await getContentCreatorDashboardOverview(ctx.db, {
        enrollmentDays: input.enrollmentDays,
        recentCourseLimit: input.recentCourseLimit,
        userId: ctx.session.user.id,
      });
    }),
});
